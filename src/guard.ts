import type { GuardDecision, Intent } from "./types.js";

function pickNumber(source: any, keys: string[]): number | undefined {
  for (const key of keys) {
    const v = source?.[key];
    if (v === undefined || v === null) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

export function evaluateIntent(intent: Intent, quote: any): GuardDecision {
  const checks: GuardDecision["checks"] = {};

  const priceImpact = pickNumber(quote?.data ?? quote, ["priceImpactPct", "priceImpact", "impact", "price_impact"]);
  const usdOut = pickNumber(quote?.data ?? quote, ["toTokenUsdValue", "estimatedOutUsd", "outUsd", "toUsd"]);
  const autoSlippage = pickNumber(quote?.data ?? quote, ["slippage", "autoSlippage", "slippagePct"]);

  checks.slippage = {
    ok: autoSlippage === undefined ? true : autoSlippage <= intent.maxSlippagePct,
    value: autoSlippage === undefined ? "N/A" : `${autoSlippage}% <= ${intent.maxSlippagePct}%`
  };

  checks.priceImpact = {
    ok: priceImpact === undefined ? true : priceImpact <= intent.maxPriceImpactPct,
    value: priceImpact === undefined ? "N/A" : `${priceImpact}% <= ${intent.maxPriceImpactPct}%`
  };

  checks.minUsdOut = {
    ok: intent.minUsdOut === undefined || usdOut === undefined ? true : usdOut >= intent.minUsdOut,
    value:
      intent.minUsdOut === undefined
        ? "No minimum set"
        : usdOut === undefined
          ? "N/A"
          : `$${usdOut.toFixed(4)} >= $${intent.minUsdOut.toFixed(4)}`
  };

  const failed = Object.entries(checks).find(([, v]) => !v.ok);
  if (failed) return { ok: false, reason: `${failed[0]} check failed`, checks };

  return { ok: true, checks };
}
