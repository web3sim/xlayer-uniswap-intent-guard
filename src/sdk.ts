import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { IntentSchema, type ExecutionReport, type Intent } from "./types.js";
import { applyPreset } from "./policy.js";
import { evaluateIntent } from "./guard.js";
import { executeSwap, getQuote, getSwapTxData, simulateTx } from "./onchainos.js";
import { checkAndApplyBudget, loadState, saveState } from "./state.js";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function shouldUseMev(intent: Intent, quote: any) {
  if (intent.mevMode === "force") return true;
  if (intent.mevMode === "off") return false;
  const q = quote?.data?.[0] ?? quote?.data ?? quote;
  const d = q?.routerResult ?? q;
  const fromAmount = Number(d?.fromTokenAmount ?? 0);
  const fromDec = Number(d?.fromToken?.decimal ?? 18);
  const fromPrice = Number(d?.fromToken?.tokenUnitPrice ?? 0);
  const slippage = intent.maxSlippagePct / 100;
  const notional = (fromAmount / 10 ** fromDec) * fromPrice;
  const potentialLoss = notional * slippage;
  return potentialLoss >= 50 || notional >= 200;
}

function explorerLink(chain: string, txHash: string) {
  if (!txHash) return "";
  if (chain.toLowerCase() === "xlayer") return `https://www.okx.com/web3/explorer/xlayer/tx/${txHash}`;
  return txHash;
}

async function writeReport(report: ExecutionReport) {
  await mkdir("reports", { recursive: true });
  const file = join("reports", `${stamp()}.json`);
  await writeFile(file, JSON.stringify(report, null, 2));
  return file;
}

export async function runIntent(input: unknown): Promise<{ reportFile: string; report: ExecutionReport }> {
  let intent = IntentSchema.parse(input);
  intent = applyPreset(intent);

  const state = await loadState();
  const intentId = intent.intentId ?? `${intent.wallet.toLowerCase()}:${intent.chain}:${intent.fromToken}:${intent.toToken}:${intent.readableAmount}`;
  if (state.seenIntentIds.includes(intentId)) {
    const blocked = {
      ok: false,
      reason: "replayProtection check failed",
      riskScore: 100,
      summary: `BLOCK: replayProtection. riskScore=100`,
      checks: { replayProtection: { ok: false, value: `intentId ${intentId} already executed` } }
    };
    const report: ExecutionReport = { timestamp: new Date().toISOString(), intent, decision: blocked, quote: null, executed: false };
    const reportFile = await writeReport(report);
    return { reportFile, report };
  }

  const quote = await getQuote({
    chain: intent.chain,
    fromToken: intent.fromToken,
    toToken: intent.toToken,
    readableAmount: intent.readableAmount
  });

  const decision = evaluateIntent(intent, quote);
  if (!decision.ok) {
    const report: ExecutionReport = { timestamp: new Date().toISOString(), intent, decision, quote, executed: false };
    const reportFile = await writeReport(report);
    return { reportFile, report };
  }

  // budget gate using quote-estimated inUsd
  const q = quote?.data?.[0] ?? quote?.data ?? quote;
  const d = q?.routerResult ?? q;
  const inRaw = Number(d?.fromTokenAmount ?? 0);
  const inDec = Number(d?.fromToken?.decimal ?? 18);
  const inPrice = Number(d?.fromToken?.tokenUnitPrice ?? 0);
  const spendUsd = (inRaw / 10 ** inDec) * inPrice;
  const budget = checkAndApplyBudget(state, intent.wallet, spendUsd, intent.maxDailyNotionalUsd, intent.maxDailyTxCount);
  if (!budget.ok) {
    const blocked = {
      ok: false,
      reason: "budgetGate check failed",
      riskScore: 100,
      summary: `BLOCK: budgetGate. riskScore=100`,
      checks: { budgetGate: { ok: false, value: budget.reason ?? "budget blocked" } }
    };
    const report: ExecutionReport = { timestamp: new Date().toISOString(), intent, decision: blocked, quote, executed: false };
    const reportFile = await writeReport(report);
    return { reportFile, report };
  }

  let simulation: unknown;
  if (intent.simulateBeforeExecute) {
    const swapData = await getSwapTxData({
      chain: intent.chain,
      wallet: intent.wallet,
      fromToken: intent.fromToken,
      toToken: intent.toToken,
      readableAmount: intent.readableAmount,
      slippage: intent.maxSlippagePct
    });
    const tx = swapData?.data?.[0]?.tx;
    if (!tx?.to || !tx?.data || !tx?.from) {
      const blocked = {
        ok: false,
        reason: "simulationPayload check failed",
        riskScore: 100,
        summary: "BLOCK: simulationPayload. riskScore=100",
        checks: { simulationPayload: { ok: false, value: "swap calldata unavailable" } }
      };
      const report: ExecutionReport = { timestamp: new Date().toISOString(), intent, decision: blocked, quote, executed: false };
      const reportFile = await writeReport(report);
      return { reportFile, report };
    }
    simulation = await simulateTx({
      chain: intent.chain,
      from: tx.from,
      to: tx.to,
      data: tx.data,
      amount: tx.value ?? "0"
    });
    const simOk = simulation && (simulation as any).ok !== false;
    if (!simOk) {
      const blocked = {
        ok: false,
        reason: "simulation check failed",
        riskScore: 100,
        summary: "BLOCK: simulation. riskScore=100",
        checks: { simulation: { ok: false, value: "gateway simulate failed" } }
      };
      const report: ExecutionReport = { timestamp: new Date().toISOString(), intent, decision: blocked, quote, simulation, executed: false };
      const reportFile = await writeReport(report);
      return { reportFile, report };
    }
  }

  if (intent.dryRun) {
    const report: ExecutionReport = { timestamp: new Date().toISOString(), intent, decision, quote, simulation, executed: false };
    const reportFile = await writeReport(report);
    return { reportFile, report };
  }

  const mevProtection = shouldUseMev(intent, quote);
  let tx: any;
  try {
    tx = await executeSwap({
      chain: intent.chain,
      wallet: intent.wallet,
      fromToken: intent.fromToken,
      toToken: intent.toToken,
      readableAmount: intent.readableAmount,
      slippage: intent.maxSlippagePct,
      mevProtection,
      gasLevel: "average"
    });
  } catch (err) {
    if (!intent.fallbackExecution) throw err;
    // fallback: raise gas + tiny slippage bump (within cap)
    const fallbackSlip = Math.min(intent.maxSlippagePct + 0.3, 5);
    tx = await executeSwap({
      chain: intent.chain,
      wallet: intent.wallet,
      fromToken: intent.fromToken,
      toToken: intent.toToken,
      readableAmount: intent.readableAmount,
      slippage: fallbackSlip,
      mevProtection,
      gasLevel: "fast"
    });
  }

  state.seenIntentIds.push(intentId);
  await saveState(state);

  const txHash = tx?.data?.swapTxHash ?? tx?.swapTxHash;
  const links = txHash ? [explorerLink(intent.chain, txHash)] : [];
  const report: ExecutionReport = {
    timestamp: new Date().toISOString(),
    intent,
    decision,
    quote,
    simulation,
    executed: true,
    tx,
    explorerLinks: links
  };
  const reportFile = await writeReport(report);
  return { reportFile, report };
}
