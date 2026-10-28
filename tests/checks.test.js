import test from "node:test";
import assert from "node:assert/strict";

import { analyzeMarket, analyzeRpc, isEvmAddress } from "../src/checks.js";

const ADDRESS = "0x1111111111111111111111111111111111111111";

function market(overrides = {}) {
  return {
    symbol: "ETH/USDso:USDso",
    display: "ETH-PERP",
    type: "swap",
    active: true,
    info: {
      poolAddress: ADDRESS,
      marginBank: ADDRESS,
      quoteToken: ADDRESS,
      baseToken: ADDRESS,
      tickSize: "1000000000000000",
      lotSize: "1000",
      minQuantity: "10000",
      markPrice: "2000000000000000000000",
      ...overrides.info,
    },
    ...overrides,
  };
}

test("validates EVM addresses without accepting malformed values", () => {
  assert.equal(isEvmAddress(ADDRESS), true);
  assert.equal(isEvmAddress("0x1234"), false);
  assert.equal(isEvmAddress(undefined), false);
});

test("accepts a healthy RPC response", () => {
  assert.deepEqual(analyzeRpc({ chainId: 50383, blockNumber: 42n, latencyMs: 120 }), {
    ok: true,
    findings: [],
  });
});

test("flags the wrong chain and an invalid block height", () => {
  const result = analyzeRpc({ chainId: 1, blockNumber: -1n, latencyMs: 120 });
  assert.equal(result.ok, false);
  assert.deepEqual(result.findings.map((finding) => finding.code), ["RPC_CHAIN_ID", "RPC_BLOCK_HEIGHT"]);
});

test("normalizes a healthy market and computes spread and mark divergence", () => {
  const result = analyzeMarket({
    market: market(),
    liveMark: 2005,
    orderBook: { bids: [[2000, 1]], asks: [[2010, 1]] },
  });

  assert.equal(result.findings.length, 0);
  assert.equal(result.record.display, "ETH-PERP");
  assert.equal(result.record.spreadBps, 50);
  assert.equal(result.record.markDivergenceBps, 24.94);
});

test("finds invalid metadata and missing prices while recording an empty book", () => {
  const result = analyzeMarket({
    market: market({ info: { poolAddress: "bad", tickSize: "0", markPrice: "0" } }),
    liveMark: undefined,
    orderBook: { bids: [], asks: [] },
  });

  assert.deepEqual(result.findings.map((finding) => finding.code), [
    "MARKET_ADDRESS",
    "MARKET_GRID",
    "ROW_MARK_MISSING",
    "LIVE_MARK_MISSING",
  ]);
  assert.equal(result.record.bookState, "empty");
});

test("flags a crossed order book without treating documented mark lag as a defect", () => {
  const result = analyzeMarket({
    market: market(),
    liveMark: 2100,
    orderBook: { bids: [[2110, 1]], asks: [[2090, 1]] },
  });

  assert.deepEqual(result.findings.map((finding) => finding.code), ["ORDER_BOOK_CROSSED"]);
  assert.equal(result.findings[0].severity, "major");
  assert.equal(result.record.markDivergenceBps, 476.19);
  assert.equal(result.record.bookState, "crossed");
});

test("records a one-sided order book without creating a bounty finding", () => {
  const result = analyzeMarket({
    market: market(),
    liveMark: 2000,
    orderBook: { bids: [[1999, 1]], asks: [] },
  });
  assert.equal(result.findings.length, 0);
  assert.equal(result.record.bookState, "one-sided");
});
