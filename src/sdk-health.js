function message(error) {
  return error instanceof Error ? error.message : String(error);
}

export function assertCompleteMarketDiscovery(exchange) {
  const problems = [];
  if (exchange.registryReadError) {
    problems.push(`registry: ${message(exchange.registryReadError)}`);
  }
  if (exchange.perpDiscoveryError) {
    problems.push(`perps: ${message(exchange.perpDiscoveryError)}`);
  }
  if (exchange.perpDiscoveryPartialFailure) {
    const partial = exchange.perpDiscoveryPartialFailure;
    problems.push(`partial: ${partial.failed} of ${partial.total} pools failed`);
  }
  if (problems.length > 0) {
    throw new Error(`Market discovery is incomplete; refusing to publish a partial scan (${problems.join("; ")}).`);
  }
}
