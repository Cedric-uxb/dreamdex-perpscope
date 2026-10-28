import { analyzeMarket, analyzeRpc } from "./checks.js";

function summarize(marketsChecked, findings, inconclusive) {
  return {
    marketsChecked,
    findings: findings.length,
    inconclusive: inconclusive.length,
    major: findings.filter((item) => item.severity === "major").length,
    normal: findings.filter((item) => item.severity === "normal").length,
    info: findings.filter((item) => item.severity === "info").length,
  };
}

export async function runScan(adapter, options = {}) {
  const now = options.now ?? new Date();
  try {
    const rpc = await adapter.rpcStatus();
    const rpcAnalysis = analyzeRpc(rpc);
    const availableMarkets = await adapter.markets();
    const markets = [];
    const findings = [...rpcAnalysis.findings];
    const inconclusive = [];

    for (const market of availableMarkets) {
      try {
        const state = await adapter.marketState(market);
        const analysis = analyzeMarket({ market, ...state });
        markets.push(analysis.record);
        findings.push(...analysis.findings);
      } catch (error) {
        inconclusive.push({
          code: "MARKET_PROBE_ERROR",
          market: market.display ?? market.symbol ?? "unknown-market",
          message: error instanceof Error ? error.message : String(error),
          evidence: {},
        });
      }
    }

    return {
      generatedAt: now.toISOString(),
      network: {
        name: "Somnia Tokyo (Hideki)",
        chainId: rpc.chainId,
        blockNumber: String(rpc.blockNumber),
        latencyMs: rpc.latencyMs,
      },
      summary: summarize(availableMarkets.length, findings, inconclusive),
      markets,
      findings,
      inconclusive,
    };
  } finally {
    await adapter.close();
  }
}
