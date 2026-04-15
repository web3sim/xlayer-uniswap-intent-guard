# Live Onchain Proof (X Layer)

## Wallet
- `0x37df30b3085fd83df98c49102e62f3d9feadd678`

## 3 Live swaps executed (OKB -> USDC)
Parameters:
- chain: `xlayer`
- from: native OKB `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`
- to: USDC `0x74b7f16337b8972027f6196a17a631ac6de26d22`
- amount: `0.0005 OKB`
- slippage: `1%`

Tx hashes:
1. `0xb3fa57d5fab02129acfea851d37f05e8f665430d9f80c78b53c4ec2f4a44cd0b`
2. `0x08f92809647cd0e304321041dab03ba74c750daf89d1e0bda0f6ed54205bc45f`
3. `0x0826dafc1315f0d6332b5a195bb9b0fae3d0823594ebf4c0de6a135cd91d1c77`

Explorer links:
- https://www.okx.com/web3/explorer/xlayer/tx/0xb3fa57d5fab02129acfea851d37f05e8f665430d9f80c78b53c4ec2f4a44cd0b
- https://www.okx.com/web3/explorer/xlayer/tx/0x08f92809647cd0e304321041dab03ba74c750daf89d1e0bda0f6ed54205bc45f
- https://www.okx.com/web3/explorer/xlayer/tx/0x0826dafc1315f0d6332b5a195bb9b0fae3d0823594ebf4c0de6a135cd91d1c77

## Security pre-check
```bash
onchainos security token-scan --tokens "196:0x74b7f16337b8972027f6196a17a631ac6de26d22"
```

## Guard proofs
- Safe scenario proof: `proof/guard-safe-proof.json`
- Unsafe scenario proof: `proof/guard-unsafe-proof.json`

## Reproduce live execution
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
