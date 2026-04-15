# X Layer Uniswap Intent Execution Guard (Skill Arena)

Intent-aware swap guard for X Layer.

## What it does

`intent-guard` enforces policy checks before executing swaps:

- max slippage
- max price impact
- minimum USD out
- minimum route count (route sanity)
- optional DEX allowlist check
- token denylist
- max notional USD cap
- strict required quote fields
- dry-run mode
- optional MEV protection on execution

It uses `onchainos` for quote + execute, so it works with real onchain routing.

## Why this is competition-grade

- Reusable agent primitive (Skill Arena fit)
- Deterministic guardrails (safer than raw swap calls)
- Proof-first outputs (`reports/*.json`) for judges
- Ready to target **Best Uniswap integration** by tightening allowlist + route policy

## Setup

```bash
npm install
npm run build
```

Prerequisite:

- `onchainos` installed and wallet logged in (`onchainos wallet status`)

## Run

```bash
# safe dry-run
npm run demo:safe

# unsafe dry-run (should block)
npm run demo:unsafe

# generic
node dist/cli.js examples/intent.safe.json
```

## Intent schema

```json
{
  "chain": "xlayer",
  "wallet": "0x...",
  "fromToken": "0x...",
  "toToken": "0x...",
  "readableAmount": "0.1",
  "maxSlippagePct": 1,
  "maxPriceImpactPct": 3,
  "minUsdOut": 5,
  "minRoutes": 1,
  "requireDexAllowlist": ["uniswap"],
  "denyTokens": ["0xdead..."],
  "maxNotionalUsd": 500,
  "requireQuoteFields": ["slippage", "priceImpact", "usdOut"],
  "dryRun": true,
  "mevProtection": true
}
```

## Reports

Each run writes a judge-auditable report JSON under `reports/`:

- intent
- quote payload
- pass/fail decision per check
- computed `riskScore` (0-100)
- execution output when executed

## Test

```bash
npm test
```
