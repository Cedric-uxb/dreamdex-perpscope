import { performance } from "node:perf_hooks";

import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { defineChain } from "viem";

import { HIDEKI } from "./config.js";
import { assertCompleteMarketDiscovery } from "./sdk-health.js";

async function rpc(method) {
  const response = await fetch(HIDEKI.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: [] }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`RPC ${method} returned HTTP ${response.status}.`);
  const payload = await response.json();
  if (payload.error) throw new Error(`RPC ${method} failed: ${payload.error.message ?? JSON.stringify(payload.error)}`);
  return payload.result;
}

export function createSdkAdapter() {
  const chain = defineChain({
    id: HIDEKI.chainId,
    name: HIDEKI.name,
    nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
    rpcUrls: { default: { http: [HIDEKI.rpcUrl], webSocket: [HIDEKI.wsRpcUrl] } },
  });
  const exchange = new SomniaMarkets({
    indexerUrl: HIDEKI.indexerUrl,
    chain,
    wsRpcUrl: HIDEKI.wsRpcUrl,
    // The official bot kit uses these deterministic testnet singletons on Hideki.
    addresses: SOMNIA_TESTNET_ADDRESSES,
  });

  return {
    async rpcStatus() {
      const started = performance.now();
      const [chainId, blockNumber] = await Promise.all([rpc("eth_chainId"), rpc("eth_blockNumber")]);
      return {
        chainId: Number.parseInt(chainId, 16),
        blockNumber: BigInt(blockNumber),
        latencyMs: Math.round(performance.now() - started),
      };
    },
    async markets() {
      const registry = await exchange.loadMarkets(true);
      assertCompleteMarketDiscovery(exchange);
      return Object.values(registry)
        .filter((market) => market.type === "swap" && market.active)
        .map((market) => ({
          symbol: market.symbol,
          display: `${market.symbol.split("/")[0]}-PERP`,
          type: market.type,
          active: market.active,
          info: market.info,
        }));
    },
    async marketState(market) {
      const [health, orderBook] = await Promise.all([
        exchange.client.getPerpHealthSnapshot(market.info.poolAddress),
        exchange.fetchOrderBook(market.symbol, 1),
      ]);
      return {
        // Perp prices are fixed at 18 decimals in the official market schema.
        liveMark: health.priceable && Number(health.markPrice) > 0 ? Number(health.markPrice) / 1e18 : undefined,
        orderBook,
      };
    },
    async close() {
      try {
        await Promise.race([
          Promise.resolve(exchange.close?.()),
          new Promise((resolve) => setTimeout(resolve, 2_000)),
        ]);
      } catch {
        // A failed socket close must not discard an already completed report.
      }
    },
  };
}
