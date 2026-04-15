import { mkdir, readFile, writeFile } from "node:fs/promises";

export type GuardState = {
  seenIntentIds: string[];
  spendByWalletUsd: Record<string, { day: string; spentUsd: number; txCount: number }>;
};

const STATE_DIR = ".intent-guard";
const STATE_FILE = `${STATE_DIR}/state.json`;

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function loadState(): Promise<GuardState> {
  try {
    const raw = await readFile(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { seenIntentIds: [], spendByWalletUsd: {} };
  }
}

export async function saveState(state: GuardState): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

export function checkAndApplyBudget(
  state: GuardState,
  wallet: string,
  spendUsd: number,
  maxDailyNotionalUsd?: number,
  maxDailyTxCount?: number
): { ok: boolean; reason?: string } {
  const key = wallet.toLowerCase();
  const currentDay = dayKey();
  const slot = state.spendByWalletUsd[key] ?? { day: currentDay, spentUsd: 0, txCount: 0 };
  if (slot.day !== currentDay) {
    slot.day = currentDay;
    slot.spentUsd = 0;
    slot.txCount = 0;
  }

  if (maxDailyNotionalUsd !== undefined && slot.spentUsd + spendUsd > maxDailyNotionalUsd) {
    return { ok: false, reason: `daily notional cap exceeded: ${slot.spentUsd + spendUsd} > ${maxDailyNotionalUsd}` };
  }
  if (maxDailyTxCount !== undefined && slot.txCount + 1 > maxDailyTxCount) {
    return { ok: false, reason: `daily tx count cap exceeded: ${slot.txCount + 1} > ${maxDailyTxCount}` };
  }

  slot.spentUsd += spendUsd;
  slot.txCount += 1;
  state.spendByWalletUsd[key] = slot;
  return { ok: true };
}
