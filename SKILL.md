---
name: xlayer-uniswap-intent-guard
description: Policy-enforced X Layer swap guard. Use for safe agent swap execution with presets, simulation gate, strict allowlists, replay protection, budgets, and auditable reports.
version: 1.0.0
---

# X Layer Uniswap Intent Execution Guard

## Use when
- Agent needs guarded swap execution on X Layer
- You need deterministic pass/block decisions before swap
- You need auditable outputs for judges/compliance

## Modes
- **CLI**: `node dist/cli.js <intent.json>`
- **SDK**: `runIntent(intent)` for app integration

## Mandatory pipeline
1. Parse + apply preset (`safe|balanced|aggressive`)
2. Quote fetch (`swap quote`)
3. Guard evaluation (policy checks)
4. Budget + replay checks
5. Simulation gate (`swap swap` + `gateway simulate`)
6. Execute (or dry-run)
7. Persist report (`reports/*.json`)

## Policy checks
- slippage, price impact, minUsdOut, maxNotionalUsd
- routeCount, maxHops
- dex allowlist + strict allowlist mode
- token denylist
- required quote fields
- price deviation vs spot
- from/to distinct

## Governance checks
- `intentId` replay protection
- wallet daily notional cap
- wallet daily tx-count cap

## Execution controls
- `mevMode`: `auto | force | off`
- `fallbackExecution`: one bounded retry with faster gas
- `simulateBeforeExecute`: hard gate on simulation

## Demo commands
```bash
npm run demo:safe
npm run demo:unsafe
npm run demo:all
```

## Proof artifacts
- `PROOF.md`
- `proof/live-swaps.json`
- `proof/guard-safe-proof.json`
- `proof/guard-unsafe-proof.json`

## Extension points
- enforce Uniswap fee-tier constraints
- add TWAP oracle source for stronger deviation checks
- add webhook notifier for blocked intents
