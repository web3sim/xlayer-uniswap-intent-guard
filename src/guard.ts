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

function pickArray(source: any, keys: string[]): unknown[] | undefined {
  for (const key of keys) {
    const v = source?.[key];
    if (Array.isArray(v)) return v;
  }
  return undefined;
}

function scoreFromChecks(checks: GuardDecision["checks"]) {
  const failed = Object.values(checks).filter((c) => !c.ok).length;
  const total = Math.max(Object.keys(checks).length, 1);
  // 0 = safest, 100 = worst
  return Math.round((failed / total) * 100);
}

export function evaluateIntent(intent: Intent, quote: any): GuardDecision {
  const checks: GuardDecision["checks"] = {};

  const data = quote?.data ?? quote;
  const priceImpact = pickNumber(data, ["priceImpactPct", "priceImpact", "impact", "price_impact"]);
  const usdOut = pickNumber(data, ["toTokenUsdValue", "estimatedOutUsd", "outUsd", "toUsd"]);
  const autoSlippage = pickNumber(data, ["slippage", "autoSlippage", "slippagePct"]);
  const amountOut = pickNumber(data, ["toTokenAmount", "outAmount", "toAmount", "amountOut"]);
  const notionalInUsd = pickNumber(data, ["fromTokenUsdValue", "inUsd", "fromUsd"]);
  const routes = pickArray(data, ["routes", "route", "paths", "path"]);

  checks.quoteData = {
    ok: !!data,
    value: data ? "quote data present" : "quote data missing"
  };

  checks.fromToDistinct = {
    ok: intent.fromToken.toLowerCase() !== intent.toToken.toLowerCase(),
    value: `${intent.fromToken} != ${intent.toToken}`
  };

  if (intent.denyTokens?.length) {
    const deny = intent.denyTokens.map((x) => x.toLowerCase());
    const hit = [intent.fromToken.toLowerCase(), intent.toToken.toLowerCase()].find((t) => deny.includes(t));
    checks.denyTokens = {
      ok: !hit,
      value: hit ? `blocked token ${hit}` : "no denylist token used"
    };
  }

  checks.amountOut = {
    ok: amountOut === undefined ? true : amountOut > 0,
    value: amountOut === undefined ? "N/A" : `${amountOut} > 0`
  };

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

  if (intent.maxNotionalUsd !== undefined) {
    checks.maxNotionalUsd = {
      ok: notionalInUsd === undefined ? true : notionalInUsd <= intent.maxNotionalUsd,
      value:
        notionalInUsd === undefined
          ? "N/A"
          : `$${notionalInUsd.toFixed(4)} <= $${intent.maxNotionalUsd.toFixed(4)}`
    };
  }

  const routeCount = routes?.length ?? 0;
  checks.routeCount = {
    ok: routeCount >= intent.minRoutes,
    value: `${routeCount} >= ${intent.minRoutes}`
  };

  if (intent.requireDexAllowlist?.length) {
    const dexNames = (routes ?? [])
      .map((r: any) => (r?.dex ?? r?.dexName ?? r?.name ?? "").toString().toLowerCase())
      .filter(Boolean);
    const allow = intent.requireDexAllowlist.map((x) => x.toLowerCase());
    const hits = dexNames.filter((d) => allow.includes(d));
    checks.dexAllowlist = {
      ok: hits.length > 0,
      value: `matched=${hits.join(",") || "none"}; allow=${allow.join(",")}`
    };
  }

  // strict quote completeness requirements
  const availability: Record<string, boolean> = {
    slippage: autoSlippage !== undefined,
    priceImpact: priceImpact !== undefined,
    usdOut: usdOut !== undefined,
    amountOut: amountOut !== undefined
  };
  for (const f of intent.requireQuoteFields) {
    checks[`requireField:${f}`] = {
      ok: availability[f],
      value: availability[f] ? `${f} present` : `${f} missing`
    };
  }

  const failed = Object.entries(checks).find(([, v]) => !v.ok);
  const riskScore = scoreFromChecks(checks);
  if (failed) return { ok: false, reason: `${failed[0]} check failed`, checks, riskScore };

  return { ok: true, checks, riskScore };
}
