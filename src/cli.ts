#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { IntentSchema, type ExecutionReport } from "./types.js";
import { evaluateIntent } from "./guard.js";
import { executeSwap, getQuote } from "./onchainos.js";

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function writeReport(report: ExecutionReport) {
  await mkdir("reports", { recursive: true });
  const file = join("reports", `${stamp()}.json`);
  await writeFile(file, JSON.stringify(report, null, 2));
  return file;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: intent-guard <intent.json>");
    process.exit(1);
  }

  const raw = JSON.parse(await readFile(file, "utf8"));
  const intent = IntentSchema.parse(raw);

  console.log(`[intent-guard] loading ${basename(file)}`);
  console.log("[1/3] Fetching quote...");
  const quote = await getQuote({
    chain: intent.chain,
    fromToken: intent.fromToken,
    toToken: intent.toToken,
    readableAmount: intent.readableAmount
  });

  console.log("[2/3] Evaluating guardrails...");
  const decision = evaluateIntent(intent, quote);
  console.log(JSON.stringify({ decision }, null, 2));
  console.log(`[SUMMARY] ${decision.summary}`);

  if (!decision.ok) {
    const reportFile = await writeReport({
      timestamp: new Date().toISOString(),
      intent,
      decision,
      quote,
      executed: false
    });
    console.error(`[BLOCKED] ${decision.reason}`);
    console.error(`[REPORT] ${reportFile}`);
    process.exit(2);
  }

  if (intent.dryRun) {
    const reportFile = await writeReport({
      timestamp: new Date().toISOString(),
      intent,
      decision,
      quote,
      executed: false
    });
    console.log("[DRY-RUN] Intent passed. Execution skipped.");
    console.log(`[REPORT] ${reportFile}`);
    return;
  }

  console.log("[3/3] Executing swap...");
  const tx = await executeSwap({
    chain: intent.chain,
    wallet: intent.wallet,
    fromToken: intent.fromToken,
    toToken: intent.toToken,
    readableAmount: intent.readableAmount,
    slippage: intent.maxSlippagePct,
    mevProtection: intent.mevProtection
  });

  const reportFile = await writeReport({
    timestamp: new Date().toISOString(),
    intent,
    decision,
    quote,
    executed: true,
    tx
  });

  console.log(JSON.stringify({ tx }, null, 2));
  console.log(`[REPORT] ${reportFile}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
