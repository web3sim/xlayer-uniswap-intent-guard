import type { Intent } from "./types.js";

export type PolicyPreset = "safe" | "balanced" | "aggressive";

export function applyPreset(intent: Intent): Intent {
  const preset = intent.preset ?? "balanced";

  if (preset === "safe") {
    return {
      ...intent,
      maxSlippagePct: Math.min(intent.maxSlippagePct, 0.5),
      maxPriceImpactPct: Math.min(intent.maxPriceImpactPct, 1),
      minRoutes: Math.max(intent.minRoutes, 1),
      strictDexAllowlist: true,
      requireQuoteFields: Array.from(new Set([...(intent.requireQuoteFields ?? []), "slippage", "priceImpact", "usdOut"]))
    };
  }

  if (preset === "aggressive") {
    return {
      ...intent,
      maxSlippagePct: Math.min(Math.max(intent.maxSlippagePct, 2), 5),
      maxPriceImpactPct: Math.min(Math.max(intent.maxPriceImpactPct, 5), 20),
      minRoutes: Math.max(0, intent.minRoutes)
    };
  }

  // balanced
  return {
    ...intent,
    maxSlippagePct: Math.min(Math.max(intent.maxSlippagePct, 1), 2),
    maxPriceImpactPct: Math.min(Math.max(intent.maxPriceImpactPct, 3), 8)
  };
}
