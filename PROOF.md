# Live Onchain Proof (X Layer)

This file records real execution proofs for `xlayer-uniswap-intent-guard`.

## Wallet
- `0x37df30b3085fd83df98c49102e62f3d9feadd678`

## Live swaps executed
All 3 swaps were executed on X Layer using `onchainos swap execute` with:
- pair: `OKB -> USDC`
- `toToken`: `0x74b7f16337b8972027f6196a17a631ac6de26d22`
- amount per swap: `0.0005 OKB`
- slippage: `1%`

### Transaction hashes
1. `0xb3fa57d5fab02129acfea851d37f05e8f665430d9f80c78b53c4ec2f4a44cd0b`
2. `0x08f92809647cd0e304321041dab03ba74c750daf89d1e0bda0f6ed54205bc45f`
3. `0x0826dafc1315f0d6332b5a195bb9b0fae3d0823594ebf4c0de6a135cd91d1c77`

## Security pre-check command used
```bash
onchainos security token-scan --tokens "196:0x74b7f16337b8972027f6196a17a631ac6de26d22"
```

## Reproduce execution
```bash
onchainos swap execute \
  --chain xlayer \
  --wallet 0x37df30b3085fd83df98c49102e62f3d9feadd678 \
  --from 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee \
  --to 0x74b7f16337b8972027f6196a17a631ac6de26d22 \
  --readable-amount 0.0005 \
  --slippage 1 \
  --gas-level average
```

## Test artifacts
- Safe guard report example: `reports/2026-04-15T01-19-08-036Z.json`
- Unsafe guard report example: `reports/2026-04-15T01-19-14-783Z.json`

> `reports/` is gitignored (local artifacts). Use command output + tx hashes above as canonical proof.
