export const HIDEKI = Object.freeze({
  name: "Somnia Tokyo (Hideki)",
  chainId: 50383,
  rpcUrl: process.env.RPC_URL ?? "https://api.hideki2.infra.testnet.somnia.network",
  wsRpcUrl: process.env.WS_RPC_URL ?? "wss://api.hideki2.infra.testnet.somnia.network/ws",
  indexerUrl: process.env.INDEXER_URL ?? "https://hideki-dev.smk.somnia.host/v1/graphql",
});

export const OFFICIAL_SOURCES = Object.freeze({
  bounty: "https://dorahacks.io/hackathon/dreamdex-perps-bounty/detail",
  botKit: "https://github.com/somnia-chain/dreamdex-bot-kit",
  developerDocs: "https://app.testnet.dreamdex.io/docs/developers/perps-testnet",
});
