const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const PRICE_DECIMALS = 18;

export function isEvmAddress(value) {
  return typeof value === "string" && ADDRESS_PATTERN.test(value);
}

function finding(severity, code, message, evidence, market) {
  return { severity, code, message, evidence, ...(market ? { market } : {}) };
}

function positiveInteger(value) {
  try {
    return BigInt(value) > 0n;
  } catch {
    return false;
  }
}

function rowMark(info) {
  try {
    // The official dreamDEX perp market schema defines prices at 18 decimals.
    return Number(BigInt(info.markPrice)) / 10 ** PRICE_DECIMALS;
  } catch {
    return 0;
  }
}

function round(value) {
  return Number(value.toFixed(2));
}

export function analyzeRpc(status, expectedChainId = 50383) {
  const findings = [];
  if (status.chainId !== expectedChainId) {
    findings.push(
      finding("major", "RPC_CHAIN_ID", `RPC returned chain ${status.chainId}; expected ${expectedChainId}.`, {
        expectedChainId,
        actualChainId: status.chainId,
      }),
    );
  }
  if (typeof status.blockNumber !== "bigint" || status.blockNumber < 0n) {
    findings.push(
      finding("major", "RPC_BLOCK_HEIGHT", "RPC returned an invalid latest block height.", {
        blockNumber: String(status.blockNumber),
      }),
    );
  }
  return { ok: findings.length === 0, findings };
}

export function analyzeMarket({ market, liveMark, orderBook }) {
  const findings = [];
  const info = market.info ?? {};
  const display = market.display ?? market.symbol ?? "unknown-market";
  const addressFields = ["poolAddress", "marginBank", "quoteToken", "baseToken"];
  const badAddresses = addressFields.filter((field) => !isEvmAddress(info[field]));
  if (badAddresses.length > 0) {
    findings.push(
      finding("major", "MARKET_ADDRESS", `Market metadata has invalid address fields: ${badAddresses.join(", ")}.`, {
        fields: badAddresses,
      }, display),
    );
  }

  const gridFields = ["tickSize", "lotSize", "minQuantity"];
  const badGrid = gridFields.filter((field) => !positiveInteger(info[field]));
  if (badGrid.length > 0) {
    findings.push(
      finding("major", "MARKET_GRID", `Market metadata has non-positive grid fields: ${badGrid.join(", ")}.`, {
        fields: badGrid,
      }, display),
    );
  }

  const registryMark = rowMark(info);
  if (!(registryMark > 0)) {
    findings.push(
      finding("normal", "ROW_MARK_MISSING", "The market registry row has no positive mark price.", {
        markPrice: String(info.markPrice ?? "missing"),
      }, display),
    );
  }
  if (!(liveMark > 0)) {
    findings.push(
      finding("major", "LIVE_MARK_MISSING", "The pool health snapshot has no usable live mark price.", {
        liveMark: liveMark ?? null,
      }, display),
    );
  }

  const markDivergenceBps = registryMark > 0 && liveMark > 0
    ? round((Math.abs(liveMark - registryMark) / liveMark) * 10_000)
    : null;
  const bestBid = Number(orderBook?.bids?.[0]?.[0]);
  const bestAsk = Number(orderBook?.asks?.[0]?.[0]);
  const hasBid = Number.isFinite(bestBid) && bestBid > 0;
  const hasAsk = Number.isFinite(bestAsk) && bestAsk > 0;
  let bookState = "normal";
  if (!hasBid && !hasAsk) {
    bookState = "empty";
  } else if (!hasBid || !hasAsk) {
    bookState = "one-sided";
  } else if (bestBid >= bestAsk) {
    bookState = "crossed";
    findings.push(
      finding("major", "ORDER_BOOK_CROSSED", "Best bid is greater than or equal to best ask.", {
        bestBid,
        bestAsk,
      }, display),
    );
  }

  const spreadBps = hasBid && hasAsk ? round(((bestAsk - bestBid) / bestBid) * 10_000) : null;
  return {
    record: {
      display,
      symbol: market.symbol,
      active: market.active,
      rowMark: registryMark || null,
      liveMark: liveMark > 0 ? liveMark : null,
      markDivergenceBps,
      bestBid: hasBid ? bestBid : null,
      bestAsk: hasAsk ? bestAsk : null,
      spreadBps,
      bookState,
      poolAddress: isEvmAddress(info.poolAddress) ? info.poolAddress : null,
    },
    findings,
  };
}
