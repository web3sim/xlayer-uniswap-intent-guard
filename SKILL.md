---
name: xlayer-uniswap-intent-guard
description: Intent-aware guard for X Layer swaps. Use when an agent needs to validate swap safety (slippage, price impact, min USD out) before executing through onchainos swap.
version: 0.1.0
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

If any check fails, command exits with code `2` and **does not execute**.

## Files

- `src/cli.ts` – orchestration
- `src/guard.ts` – risk checks
- `src/onchainos.ts` – onchainos integration
- `examples/intent.sample.json` – runnable sample

## Error handling

- Quote command failure → stop and show onchainos error
- Guard failure → block trade and return reason
- Execute failure → return onchainos error (no retries by default)

## Extension points

- Add token allowlist / denylist checks
- Add volatility/risk oracle checks
- Add Uniswap-route-specific filters (pool fee tier, depth)
