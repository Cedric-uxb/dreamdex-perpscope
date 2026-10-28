import { OFFICIAL_SOURCES } from "./config.js";

function value(value) {
  return value === null || value === undefined ? "n/a" : String(value);
}

function safeText(input) {
  return value(input)
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .replaceAll("\r", " ")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function safeCode(input) {
  return safeText(input).replaceAll("`", "'");
}

function evidenceBlock(evidence) {
  return Object.entries(evidence ?? {})
    .map(([key, item]) => `- ${safeText(key)}: \`${safeCode(item)}\``)
    .join("\n");
}

export function renderMarkdown(scan) {
  const marketRows = scan.markets.length > 0
    ? scan.markets.map((market) =>
      `| ${safeText(market.display)} | ${safeText(market.liveMark)} | ${safeText(market.rowMark)} | ${safeText(market.markDivergenceBps)} | ${safeText(market.bestBid)} | ${safeText(market.bestAsk)} | ${safeText(market.spreadBps)} |`,
    ).join("\n")
    : "| _No market records_ | | | | | | |";
  const findingRows = scan.findings.length > 0
    ? scan.findings.map((item) =>
      `| ${safeText(item.severity)} | ${safeText(item.code)} | ${safeText(item.market)} | ${safeText(item.message)} |`,
    ).join("\n")
    : "| info | NONE | n/a | No conformance findings in this run. |";
  const inconclusiveRows = scan.inconclusive?.length > 0
    ? scan.inconclusive.map((item) =>
      `| ${safeText(item.code)} | ${safeText(item.market)} | ${safeText(item.message)} |`,
    ).join("\n")
    : "| NONE | n/a | All market probes completed. |";

  return `# PerpScope Scan Report

Generated: ${scan.generatedAt}

## Network

- Network: ${scan.network.name}
- Chain ID: ${scan.network.chainId}
- Latest block: ${scan.network.blockNumber}
- RPC latency: ${scan.network.latencyMs} ms
- Markets checked: ${scan.summary.marketsChecked}
- Findings: ${scan.summary.findings} (${scan.summary.major} major, ${scan.summary.normal} normal)
- Inconclusive probes: ${scan.summary.inconclusive ?? 0}

## Markets

| Market | Live mark | Registry mark | Divergence (bps) | Best bid | Best ask | Spread (bps) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${marketRows}

## Findings and observations

| Severity | Code | Market | Observation |
| --- | --- | --- | --- |
${findingRows}

## Inconclusive probes

| Code | Market | Observation |
| --- | --- | --- |
${inconclusiveRows}

## Method

PerpScope is read-only. It loads active swap markets through the official Somnia Markets SDK, reads each pool health snapshot, and fetches one level of the public order book. It does not sign or submit transactions.

## Sources

- [dreamDEX bounty](${OFFICIAL_SOURCES.bounty})
- [Official bot kit](${OFFICIAL_SOURCES.botKit})
- [Developer docs](${OFFICIAL_SOURCES.developerDocs})
`;
}

export function renderFeedbackDraft(finding, scan) {
  return `# ${finding.code}: ${finding.market ?? "network"}

Review status: draft; reproduce at least twice before submitting

Severity: ${finding.severity}
Area: API | SDK | docs | app | contracts

## Steps to reproduce

1. Install this repository with \`npm install\`.
2. Run \`npm run scan\` against the default Somnia Tokyo (Hideki) endpoints.
3. Open the generated JSON and Markdown evidence in \`artifacts/\`.
4. Locate finding \`${finding.code}\` for \`${finding.market ?? "network"}\`.

## Expected

The observed SDK and chain result should remain internally valid and reproducible under the documented API contract.

## Actual

${safeText(finding.message)}

## Evidence

${evidenceBlock(finding.evidence) || "- See the attached JSON scan artifact."}

## Environment

- Scanner: PerpScope 0.1.0
- Network: ${scan.network.name}
- Chain ID: ${scan.network.chainId}
- Latest block: ${scan.network.blockNumber}
- Generated: ${scan.generatedAt}
- Wallet address: not used (read-only scan)
`;
}
