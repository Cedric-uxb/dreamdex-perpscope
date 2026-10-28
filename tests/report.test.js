import test from "node:test";
import assert from "node:assert/strict";

import { renderMarkdown, renderFeedbackDraft } from "../src/report.js";

const scan = {
  generatedAt: "2026-10-27T12:00:00.000Z",
  network: { name: "Somnia Tokyo (Hideki)", chainId: 50383, blockNumber: "123", latencyMs: 80 },
  summary: { marketsChecked: 1, findings: 1, inconclusive: 0, major: 1, normal: 0, info: 0 },
  markets: [
    { display: "ETH-PERP", liveMark: 2100, rowMark: 2000, markDivergenceBps: 476.19, bestBid: 2099, bestAsk: 2101, spreadBps: 9.53 },
  ],
  findings: [
    {
      severity: "major",
      code: "ORDER_BOOK_CROSSED",
      market: "ETH-PERP",
      message: "Best bid is greater than or equal to best ask.",
      evidence: { bestBid: 2110, bestAsk: 2090 },
    },
  ],
  inconclusive: [],
};

test("renders a readable Markdown scan report", () => {
  const markdown = renderMarkdown(scan);
  assert.match(markdown, /PerpScope Scan Report/);
  assert.match(markdown, /ETH-PERP/);
  assert.match(markdown, /ORDER_BOOK_CROSSED/);
  assert.doesNotMatch(markdown, /private key/i);
});

test("renders a feedback draft with reproduction steps and evidence", () => {
  const draft = renderFeedbackDraft(scan.findings[0], scan);
  assert.match(draft, /Review status: draft/);
  assert.match(draft, /Severity: major/);
  assert.match(draft, /Steps to reproduce/);
  assert.match(draft, /Somnia Tokyo \(Hideki\)/);
  assert.match(draft, /2110/);
});

test("sanitizes untrusted error text in Markdown tables", () => {
  const markdown = renderMarkdown({
    ...scan,
    markets: [{ ...scan.markets[0], display: "ETH|<script>PERP</script>" }],
    findings: [],
    inconclusive: [{ code: "MARKET_PROBE_ERROR", market: "ETH|PERP", message: "bad\n<script>alert(1)</script>" }],
    summary: { ...scan.summary, findings: 0, inconclusive: 1, major: 0 },
  });
  assert.doesNotMatch(markdown, /<script>/);
  assert.doesNotMatch(markdown, /ETH\|PERP/);
});
