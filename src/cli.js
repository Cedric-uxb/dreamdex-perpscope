#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { renderFeedbackDraft, renderMarkdown } from "./report.js";
import { runScan } from "./scanner.js";
import { createSdkAdapter } from "./sdk-adapter.js";

function outputDirectory(args) {
  const index = args.indexOf("--output");
  if (index === -1) return "artifacts";
  const path = args[index + 1];
  if (!path || path.startsWith("--")) throw new Error("--output requires a directory path.");
  return path;
}

function safeName(finding) {
  return `${finding.code}-${finding.market ?? "network"}`.toLowerCase().replaceAll(/[^a-z0-9-]+/g, "-");
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] !== "scan") {
    console.log("Usage: node src/cli.js scan [--output artifacts]");
    return;
  }

  const root = outputDirectory(args);
  const scan = await runScan(createSdkAdapter());
  const stamp = scan.generatedAt.replaceAll(/[:.]/g, "-");
  const runDirectory = join(root, stamp);
  const draftDirectory = join(runDirectory, "feedback-drafts");
  await mkdir(draftDirectory, { recursive: true });
  await writeFile(join(runDirectory, "scan.json"), `${JSON.stringify(scan, null, 2)}\n`);
  await writeFile(join(runDirectory, "scan.md"), renderMarkdown(scan));

  for (const finding of scan.findings.filter((item) => item.severity !== "info")) {
    await writeFile(join(draftDirectory, `${safeName(finding)}.md`), renderFeedbackDraft(finding, scan));
  }

  console.log(`PerpScope checked ${scan.summary.marketsChecked} markets.`);
  console.log(
    `Findings: ${scan.summary.findings} (${scan.summary.major} major, ${scan.summary.normal} normal).`,
  );
  console.log(`Inconclusive probes: ${scan.summary.inconclusive}.`);
  console.log(`Evidence: ${runDirectory}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
