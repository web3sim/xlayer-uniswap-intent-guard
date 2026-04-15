import { z } from "zod";

export const IntentSchema = z.object({
  // identity + anti-replay
  intentId: z.string().min(4).optional(),
  chain: z.string().default("xlayer"),
  wallet: z.string().min(1),

  // pair
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  readableAmount: z.string().min(1),

  // policies
  preset: z.enum(["safe", "balanced", "aggressive"]).default("balanced"),
  maxSlippagePct: z.number().positive().max(5).default(1),
  maxPriceImpactPct: z.number().positive().max(20).default(3),
  minUsdOut: z.number().positive().optional(),
  maxNotionalUsd: z.number().positive().optional(),
  minRoutes: z.number().int().min(0).default(0),
  requireDexAllowlist: z.array(z.string()).optional(),
  strictDexAllowlist: z.boolean().default(false),
  denyTokens: z.array(z.string()).optional(),
  requireQuoteFields: z.array(z.enum(["slippage", "priceImpact", "usdOut", "amountOut"])).default(["slippage", "priceImpact", "usdOut"]),

  // advanced quality gates
  maxHops: z.number().int().positive().optional(),
  maxPriceDeviationPct: z.number().positive().optional(),

  // budgets
  maxDailyNotionalUsd: z.number().positive().optional(),
  maxDailyTxCount: z.number().int().positive().optional(),

  // execution controls
  simulateBeforeExecute: z.boolean().default(true),
  fallbackExecution: z.boolean().default(true),
  dryRun: z.boolean().default(false),
  mevMode: z.enum(["auto", "force", "off"]).default("auto")
});

export type Intent = z.infer<typeof IntentSchema>;

export type GuardDecision = {
  ok: boolean;
  reason?: string;
  riskScore: number;
  summary: string;
  checks: Record<string, { ok: boolean; value: string }>;
};

export type ExecutionReport = {
  timestamp: string;
  intent: Intent;
  decision: GuardDecision;
  quote: unknown;
  simulation?: unknown;
  executed: boolean;
  tx?: unknown;
  explorerLinks?: string[];
};
