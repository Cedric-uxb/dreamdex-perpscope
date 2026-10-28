# PerpScope

[中文说明](README.zh-CN.md) | [Chinese design notes](docs/DESIGN.zh-CN.md)

PerpScope is a read-only conformance scanner for dreamDEX perpetual markets on Somnia Tokyo (Hideki). It turns public SDK, chain-health, and order-book reads into timestamped JSON and Markdown evidence for the dreamDEX Perps Builder Bounty.

It never requests a private key, signs a message, or sends a transaction.

## Why it exists

Feedback is useful only when the organizer can reproduce it. PerpScope checks every active perp market with the same official Somnia Markets SDK used by the dreamDEX bot kit, records exact chain context, and separates informational observations from reportable failures.

## Checks

- RPC chain ID and latest block height
- Required market contract addresses
- Positive tick, lot, and minimum-quantity grids
- Registry mark versus the pool's live chain mark as a comparison metric
- Best bid, best ask, and book state; only a crossed book is treated as a finding
- Per-market probe errors as inconclusive evidence without aborting the remaining scan
- Complete SDK market discovery; partial registry results fail the scan

Mark divergence, empty books, and one-sided books are recorded as metrics rather than findings because they can be expected transient states. PerpScope does not generate feedback drafts for metrics or inconclusive probes.

## Quick start

Requirements: Node.js 20 or newer.

```bash
npm install
npm run check
npm run scan
```

Optional endpoint overrides:

```bash
RPC_URL=https://... \
WS_RPC_URL=wss://... \
INDEXER_URL=https://... \
npm run scan -- --output artifacts
```

Each run writes:

```text
artifacts/<timestamp>/
├── scan.json
├── scan.md
└── feedback-drafts/
```

Drafts are generated only for `major` and `normal` findings. They are not submission-ready until the observation has been reproduced at least twice and manually checked against current documentation and known behavior.

## Verification

```bash
npm run check
```

The suite includes unit tests for conformance rules, an integration test with a failing market probe, and a CLI smoke test. Coverage thresholds are enforced at 80% for lines, functions, and branches.

## Safety

- No wallet connection
- No private key or seed phrase
- No signing or transaction broadcast
- No automatic public disclosure
- Security vulnerabilities must be reported privately to `security@dreamdex.io`

## Bounty status

- DoraHacks registration: confirmed on October 27, 2026
- Whitelist ticket: `DX-0296`; current approval state must be verified before Build submission
- First live scan: 21 active perp markets checked successfully
- Submission deadline: November 1, 2026 at 23:59 UTC

## Official sources

- [Bounty page](https://dorahacks.io/hackathon/dreamdex-perps-bounty/detail)
- [Developer documentation](https://app.testnet.dreamdex.io/docs/developers/perps-testnet)
- [Official dreamDEX bot kit](https://github.com/somnia-chain/dreamdex-bot-kit)

## License

MIT
