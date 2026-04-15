import { z } from "zod";

export const IntentSchema = z.object({
  chain: z.string().default("xlayer"),
  wallet: z.string().min(1),
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  readableAmount: z.string().min(1),
  maxSlippagePct: z.number().positive().max(5).default(1),
  maxPriceImpactPct: z.number().positive().max(20).default(3),
  minUsdOut: z.number().positive().optional(),
  maxNotionalUsd: z.number().positive().optional(),
  minRoutes: z.number().int().min(0).default(0),
  requireDexAllowlist: z.array(z.string()).optional(),
  denyTokens: z.array(z.string()).optional(),
  requireQuoteFields: z.array(z.enum(["slippage","priceImpact","usdOut","amountOut"])).default(["slippage","priceImpact","usdOut"]),
  dryRun: z.boolean().default(false),
  mevProtection: z.boolean().default(true)
});

export type Intent = z.infer<typeof IntentSchema>;

export type GuardDecision = {
  ok: boolean;
  reason?: string;
  riskScore: number;
  checks: Record<string, { ok: boolean; value: string }>;
};

export type ExecutionReport = {
  timestamp: string;
  intent: Intent;
  decision: GuardDecision;
  quote: unknown;
  executed: boolean;
  tx?: unknown;
};
