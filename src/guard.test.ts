import { describe, it, expect } from "vitest";
import { evaluateIntent } from "./guard.js";

const intent = {
  chain: "xlayer",
  wallet: "0xabc",
  fromToken: "0x1",
  toToken: "0x2",
  readableAmount: "0.1",
  maxSlippagePct: 1,
  maxPriceImpactPct: 3,
  minUsdOut: 10,
  minRoutes: 1,
  dryRun: true,
  mevProtection: true
};

describe("evaluateIntent", () => {
  it("passes safe quote", () => {
    const d = evaluateIntent(intent, {
      data: { priceImpactPct: 0.2, slippage: 0.5, estimatedOutUsd: 12, outAmount: 100, routes: [{ dex: "uniswap" }] }
    });
    expect(d.ok).toBe(true);
  });

  it("blocks high price impact", () => {
    const d = evaluateIntent(intent, {
      data: { priceImpactPct: 7, slippage: 0.5, estimatedOutUsd: 12, outAmount: 100, routes: [{ dex: "uniswap" }] }
    });
    expect(d.ok).toBe(false);
    expect(d.reason).toContain("priceImpact");
  });

  it("blocks if route count too low", () => {
    const d = evaluateIntent({ ...intent, minRoutes: 2 }, { data: { slippage: 0.3, priceImpactPct: 0.2, outAmount: 1, routes: [{ dex: "x" }] } });
    expect(d.ok).toBe(false);
    expect(d.reason).toContain("routeCount");
  });
});
