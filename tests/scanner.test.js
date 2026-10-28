import test from "node:test";
import assert from "node:assert/strict";

import { runScan } from "../src/scanner.js";

const ADDRESS = "0x2222222222222222222222222222222222222222";

test("continues after one market probe fails and returns deterministic evidence", async () => {
  const adapter = {
    async rpcStatus() {
      return { chainId: 50383, blockNumber: 100n, latencyMs: 5 };
    },
    async markets() {
      return [
        {
          symbol: "BTC/USDso:USDso",
          display: "BTC-PERP",
          type: "swap",
          active: true,
          info: {
            poolAddress: ADDRESS,
            marginBank: ADDRESS,
            quoteToken: ADDRESS,
            baseToken: ADDRESS,
            tickSize: "1",
            lotSize: "1",
            minQuantity: "1",
            markPrice: "100000000000000000000",
          },
        },
        {
          symbol: "ETH/USDso:USDso",
          display: "ETH-PERP",
          type: "swap",
          active: true,
          info: {
            poolAddress: ADDRESS,
            marginBank: ADDRESS,
            quoteToken: ADDRESS,
            baseToken: ADDRESS,
            tickSize: "1",
            lotSize: "1",
            minQuantity: "1",
            markPrice: "2000000000000000000000",
          },
        },
      ];
    },
    async marketState(item) {
      if (item.display === "ETH-PERP") throw new Error("temporary indexer failure");
      return { liveMark: 100, orderBook: { bids: [[99, 1]], asks: [[101, 1]] } };
    },
    async close() {},
  };

  const result = await runScan(adapter, { now: new Date("2026-10-27T12:00:00Z") });

  assert.equal(result.network.chainId, 50383);
  assert.equal(result.markets.length, 1);
  assert.equal(result.findings.length, 0);
  assert.equal(result.inconclusive.at(-1).code, "MARKET_PROBE_ERROR");
  assert.equal(result.summary.marketsChecked, 2);
  assert.equal(result.summary.findings, 0);
  assert.equal(result.summary.inconclusive, 1);
  assert.equal(result.summary.normal, 0);
  assert.equal(result.summary.info, 0);
  assert.equal(result.generatedAt, "2026-10-27T12:00:00.000Z");
});

test("always closes the adapter after an RPC failure", async () => {
  let closed = false;
  const adapter = {
    async rpcStatus() {
      throw new Error("offline");
    },
    async close() {
      closed = true;
    },
  };

  await assert.rejects(() => runScan(adapter), /offline/);
  assert.equal(closed, true);
});
