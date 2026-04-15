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

export async function executeSwap(params: {
  chain: string;
  wallet: string;
  fromToken: string;
  toToken: string;
  readableAmount: string;
  slippage: number;
  mevProtection: boolean;
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
    "average"
  ];
  if (params.mevProtection) args.push("--mev-protection");
  return runOnchainos(args);
}
