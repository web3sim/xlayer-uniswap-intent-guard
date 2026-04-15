#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { runIntent } from "./sdk.js";

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: intent-guard <intent.json>");
    process.exit(1);
  }

  const raw = JSON.parse(await readFile(file, "utf8"));
  console.log(`[intent-guard] loading ${basename(file)}`);
  const { reportFile, report } = await runIntent(raw);

  console.log(JSON.stringify({ decision: report.decision }, null, 2));
  console.log(`[SUMMARY] ${report.decision.summary}`);

  if (!report.decision.ok) {
    console.error(`[BLOCKED] ${report.decision.reason}`);
    console.error(`[REPORT] ${reportFile}`);
    process.exit(2);
  }

  if (!report.executed) {
    console.log(`[DRY-RUN] Intent passed. Execution skipped.`);
    console.log(`[REPORT] ${reportFile}`);
    return;
  }

  console.log(JSON.stringify({ tx: report.tx, explorerLinks: report.explorerLinks }, null, 2));
  console.log(`[REPORT] ${reportFile}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
