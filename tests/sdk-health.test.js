import test from "node:test";
import assert from "node:assert/strict";

import { assertCompleteMarketDiscovery } from "../src/sdk-health.js";

test("accepts a complete SDK discovery", () => {
  assert.doesNotThrow(() => assertCompleteMarketDiscovery({
    registryReadError: null,
    perpDiscoveryError: null,
    perpDiscoveryPartialFailure: null,
  }));
});

test("rejects contained SDK registry and partial discovery failures", () => {
  assert.throws(
    () => assertCompleteMarketDiscovery({
      registryReadError: new Error("indexer unavailable"),
      perpDiscoveryError: new Error("one pool failed"),
      perpDiscoveryPartialFailure: { failed: 1, total: 21 },
    }),
    /Market discovery is incomplete.*registry: indexer unavailable.*perps: one pool failed.*1 of 21/,
  );
});
