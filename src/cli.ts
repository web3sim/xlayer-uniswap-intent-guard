#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { IntentSchema } from "./types.js";
import { evaluateIntent } from "./guard.js";
import { executeSwap, getQuote } from "./onchainos.js";

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: intent-guard <intent.json>");
    process.exit(1);
  }

  const raw = JSON.parse(await readFile(file, "utf8"));
  const intent = IntentSchema.parse(raw);

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

  if (!decision.ok) {
    console.error(`[BLOCKED] ${decision.reason}`);
    process.exit(2);
  }

  if (intent.dryRun) {
    console.log("[DRY-RUN] Intent passed. Execution skipped.");
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

  console.log(JSON.stringify({ tx }, null, 2));
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
