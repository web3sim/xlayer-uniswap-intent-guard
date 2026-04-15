# X Layer Uniswap Intent Execution Guard (Skill Arena)

Intent-aware swap guard for X Layer.

## What it does

`intent-guard` enforces policy checks before executing swaps:

- max slippage
- max price impact
- minimum USD out
- dry-run mode
- optional MEV protection on execution

It uses `onchainos` for quote + execute, so it works with real onchain routing.

## Why this is competition-grade

- Reusable agent primitive (Skill Arena fit)
- Deterministic guardrails (safer than raw swap calls)
- Ready to target **Best Uniswap integration** by plugging guard into Uniswap-based routes

## Setup

```bash
npm install
npm run build
```

Prerequisite:

- `onchainos` installed and wallet logged in (`onchainos wallet status`)

## Run

```bash
# dry-run policy check
node dist/cli.js examples/intent.sample.json

# dev mode
npm run dev -- examples/intent.sample.json
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
  "dryRun": true,
  "mevProtection": true
}
```

## Expected flow

1. Fetch quote from `onchainos swap quote`
2. Evaluate checks
3. Block or execute (`onchainos swap execute`)
4. Return decision + tx output

## Test

```bash
npm test
```
