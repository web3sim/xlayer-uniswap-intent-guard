import { execFile } from "node:child_process";

export function runOnchainos(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    execFile("onchainos", args, { timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`onchainos ${args.join(" ")} failed: ${stderr || err.message}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve({ raw: stdout });
      }
    });
  });
}

export async function getQuote(params: {
  chain: string;
  fromToken: string;
  toToken: string;
  readableAmount: string;
}) {
  return runOnchainos([
    "swap",
    "quote",
    "--chain",
    params.chain,
    "--from",
    params.fromToken,
    "--to",
    params.toToken,
    "--readable-amount",
    params.readableAmount
  ]);
}

export async function getSwapTxData(params: {
  chain: string;
  wallet: string;
  fromToken: string;
  toToken: string;
  readableAmount: string;
  slippage: number;
}) {
  return runOnchainos([
    "swap",
    "swap",
    "--chain",
    params.chain,
    "--wallet",
    params.wallet,
    "--from",
    params.fromToken,
    "--to",
    params.toToken,
    "--readable-amount",
    params.readableAmount,
    "--slippage",
    params.slippage.toString(),
    "--gas-level",
    "average"
  ]);
}

export async function simulateTx(params: {
  chain: string;
  from: string;
  to: string;
  data: string;
  amount?: string;
}) {
  const args = [
    "gateway",
    "simulate",
    "--chain",
    params.chain,
    "--from",
    params.from,
    "--to",
    params.to,
    "--data",
    params.data,
    "--amount",
    params.amount ?? "0"
  ];
  return runOnchainos(args);
}

export async function executeSwap(params: {
  chain: string;
  wallet: string;
  fromToken: string;
  toToken: string;
  readableAmount: string;
  slippage: number;
  mevProtection: boolean;
  gasLevel?: "slow" | "average" | "fast";
}) {
  const args = [
    "swap",
    "execute",
    "--chain",
    params.chain,
    "--wallet",
    params.wallet,
    "--from",
    params.fromToken,
    "--to",
    params.toToken,
    "--readable-amount",
    params.readableAmount,
    "--slippage",
    params.slippage.toString(),
    "--gas-level",
    params.gasLevel ?? "average"
  ];
  if (params.mevProtection) args.push("--mev-protection");
  return runOnchainos(args);
}
