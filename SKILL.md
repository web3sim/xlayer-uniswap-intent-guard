---
name: xlayer-uniswap-intent-guard
description: Intent-aware guard for X Layer swaps. Use when an agent needs to validate swap safety (slippage, price impact, min USD out, route sanity) before executing through onchainos swap.
version: 0.2.0
---

# X Layer Uniswap Intent Execution Guard

## Use when

- User asks for safe swap execution on X Layer
- You need deterministic pre-trade policy checks
- You want to block high-risk routes before onchain execution

## Preconditions

1. `onchainos` installed
2. Wallet logged in (`onchainos wallet status`)
3. Intent JSON prepared

## Command

```bash
node dist/cli.js <intent.json>
```

## Policy checks

- `maxSlippagePct`
- `maxPriceImpactPct`
- `minUsdOut` (optional)
- `minRoutes` (route sanity)
- `requireDexAllowlist` (optional)
- `denyTokens` (optional)
- `maxNotionalUsd` (optional)
- `requireQuoteFields` (strict quote completeness)

If any check fails, command exits with code `2` and **does not execute**.

## Files

- `src/cli.ts` – orchestration + report writing
- `src/guard.ts` – risk checks
- `src/onchainos.ts` – onchainos integration
- `examples/intent.safe.json` – pass scenario
- `examples/intent.unsafe.json` – blocked scenario

## Demo flow

```bash
npm run demo:safe
npm run demo:unsafe
```

Collect proof from `reports/*.json`.

## Error handling

- Quote command failure → stop and show onchainos error
- Guard failure → block trade and return reason
- Execute failure → return onchainos error (no retries by default)

## Extension points

- Add token allowlist / denylist checks
- Add volatility/risk oracle checks
- Add stricter Uniswap-route constraints (pool depth, fee tiers)
