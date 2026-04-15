---
name: xlayer-uniswap-intent-guard
description: Real working SkillArena swap-guard for X Layer. Use for policy-enforced swaps with presets, simulation gate, strict DEX allowlists, replay protection, wallet risk budgets, MEV mode control, fallback execution, and auditable reports.
version: 1.0.1
---

# X Layer Uniswap Intent Execution Guard

Production-ready skill for safe agent swaps on X Layer.

## When to use
- User asks to swap tokens safely on X Layer
- You need deterministic **PASS/BLOCK** decisions before execution
- You need compliance/judge-friendly proofs (reports + tx links)

## Prerequisites
1. `onchainos` installed and wallet logged in
2. project dependencies installed
3. intent JSON prepared

```bash
npm install
npm run build
onchainos wallet status
```

## Quick start (CLI)
```bash
# safe dry-run (should pass)
npm run demo:safe

# unsafe dry-run (should block)
npm run demo:unsafe

# custom intent
node dist/cli.js examples/intent.safe.json
```

## SDK usage
```ts
import { runIntent } from "xlayer-uniswap-intent-guard";

const { reportFile, report } = await runIntent({
  intentId: "trade-001",
  chain: "xlayer",
  wallet: "0x...",
  fromToken: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  toToken: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
  readableAmount: "0.001",
  preset: "balanced",
  dryRun: true
});
```

## Execution pipeline (actual implementation)
1. Parse input with `IntentSchema`
2. Apply preset (`safe|balanced|aggressive`)
3. Fetch quote via `onchainos swap quote`
4. Evaluate guard checks (slippage, impact, routes, allowlist, etc.)
5. Enforce replay protection (`intentId`) + daily wallet budgets
6. Build calldata via `onchainos swap swap`
7. Simulate via `onchainos gateway simulate` (if enabled)
8. Execute via `onchainos swap execute` (or dry-run)
9. Persist report JSON to `reports/*.json`

## Guard features implemented
- `maxSlippagePct`, `maxPriceImpactPct`
- `minUsdOut`, `maxNotionalUsd`
- `minRoutes`, `maxHops`
- `requireDexAllowlist`, `strictDexAllowlist`
- `denyTokens`
- `requireQuoteFields`
- `maxPriceDeviationPct`
- `intentId` replay protection
- `maxDailyNotionalUsd`, `maxDailyTxCount`
- `mevMode` (`auto|force|off`)
- `fallbackExecution`

## Output artifacts
- Runtime reports: `reports/*.json` (gitignored)
- Static proofs:
  - `PROOF.md`
  - `proof/live-swaps.json`
  - `proof/guard-safe-proof.json`
  - `proof/guard-unsafe-proof.json`

## README reference (how to use)
For full installation, schema, CLI commands, SDK examples, and proofs, see:
- `README.md`

## Validation commands
```bash
npm test
npm run demo:all
```
