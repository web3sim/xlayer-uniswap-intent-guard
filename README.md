# X Layer Uniswap Intent Execution Guard

Production-grade SkillArena module for policy-enforced swaps on X Layer.

## What makes this submission strong

- Real onchain proofs (3 live tx hashes)
- Policy presets (`safe`, `balanced`, `aggressive`)
- Strict guardrails + deterministic blocks
- Pre-execution simulation gate (`swap swap` + `gateway simulate`)
- Replay protection (`intentId` dedupe)
- Per-wallet daily budgets (USD + tx count)
- Auto fallback execution (fast gas + bounded slippage bump)
- SDK + CLI modes
- Report-first artifacts (`reports/*.json`)

## Core Features

### 1) Policy & Safety
- max slippage / max price impact
- min USD out / max notional USD
- route count + hop limits
- DEX allowlist + strict allowlist mode
- token denylist
- strict required quote fields
- price deviation check vs spot

### 2) Execution Reliability
- simulation gate before execute
- MEV mode selector: `auto | force | off`
- fallback execution path on failure
- explorer links in execution report

### 3) Governance Controls
- anti-replay via `intentId`
- per-wallet daily risk budgets:
  - `maxDailyNotionalUsd`
  - `maxDailyTxCount`

## Install

```bash
git clone https://github.com/web3sim/xlayer-uniswap-intent-guard.git
cd xlayer-uniswap-intent-guard
npm install
npm run build
```

## Install via Skills Registry

You can also install as a skill package using:

```bash
npx skills add web3sim/xlayer-uniswap-intent-guard --yes --global
```

Then use it in your agent runtime as a reusable skill.

## Run

```bash
# pass scenario
npm run demo:safe

# blocked scenario
npm run demo:unsafe

# combined demo
npm run demo:all
```

## SDK Usage

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

## Input Schema Highlights

```json
{
  "intentId": "trade-001",
  "preset": "safe",
  "maxSlippagePct": 0.5,
  "maxPriceImpactPct": 1,
  "minUsdOut": 5,
  "maxNotionalUsd": 200,
  "minRoutes": 1,
  "maxHops": 3,
  "requireDexAllowlist": ["uniswap"],
  "strictDexAllowlist": true,
  "denyTokens": ["0xdead..."],
  "requireQuoteFields": ["slippage", "priceImpact", "usdOut"],
  "maxDailyNotionalUsd": 500,
  "maxDailyTxCount": 10,
  "simulateBeforeExecute": true,
  "fallbackExecution": true,
  "mevMode": "auto",
  "dryRun": false
}
```

## Proof

- `PROOF.md` — live tx + reproducible commands
- `proof/live-swaps.json` — 3 onchain tx hashes
- `proof/guard-safe-proof.json`
- `proof/guard-unsafe-proof.json`

## Validation

```bash
npm test
npm run demo:all
```

All outputs are persisted under `reports/*.json` (gitignored local artifacts).
