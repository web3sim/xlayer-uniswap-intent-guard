import { describe, it, expect } from "vitest";
import { evaluateIntent } from "./guard.js";

const baseIntent = {
  chain: "xlayer",
  wallet: "0xabc",
  fromToken: "0x1",
  toToken: "0x2",
  readableAmount: "0.1",
  maxSlippagePct: 1,
  maxPriceImpactPct: 3,
  minUsdOut: 10,
  minRoutes: 1,
  requireQuoteFields: ["slippage", "priceImpact", "usdOut"],
  dryRun: true,
  mevProtection: true
} as const;

describe("evaluateIntent", () => {
  it("passes safe quote", () => {
    const d = evaluateIntent(baseIntent as any, {
      data: {
        priceImpactPct: 0.2,
        slippage: 0.5,
        estimatedOutUsd: 12,
        outAmount: 100,
        routes: [{ dex: "uniswap" }]
      }
    });
    expect(d.ok).toBe(true);
    expect(d.riskScore).toBe(0);
  });

  it("blocks high price impact", () => {
    const d = evaluateIntent(baseIntent as any, {
      data: { priceImpactPct: 7, slippage: 0.5, estimatedOutUsd: 12, outAmount: 100, routes: [{ dex: "uniswap" }] }
    });
    expect(d.ok).toBe(false);
    expect(d.reason).toContain("priceImpact");
  });

  it("blocks if route count too low", () => {
    const d = evaluateIntent({ ...(baseIntent as any), minRoutes: 2 }, { data: { slippage: 0.3, priceImpactPct: 0.2, estimatedOutUsd: 12, outAmount: 1, routes: [{ dex: "x" }] } });
    expect(d.ok).toBe(false);
    expect(d.reason).toContain("routeCount");
  });

  it("blocks missing required quote fields", () => {
    const d = evaluateIntent(baseIntent as any, { data: { routes: [{ dex: "uniswap" }] } });
    expect(d.ok).toBe(false);
    expect(d.reason).toContain("requireField");
  });

  it("blocks denied token usage", () => {
    const d = evaluateIntent({ ...(baseIntent as any), denyTokens: ["0x1"] }, {
      data: { slippage: 0.1, priceImpactPct: 0.1, estimatedOutUsd: 12, outAmount: 100, routes: [{ dex: "uniswap" }] }
    });
    expect(d.ok).toBe(false);
    expect(d.reason).toContain("denyTokens");
  });
});
