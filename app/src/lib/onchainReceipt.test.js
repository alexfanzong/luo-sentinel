import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRwaEvidenceSet,
  createProceedReceiptDraft,
  getSafeDecisionTimestamp,
} from "./onchainReceipt.js";

test("backs the decision timestamp off by one minute to avoid testnet clock skew", () => {
  assert.equal(getSafeDecisionTimestamp(1782087000), 1782086940);
});

test("creates the same deterministic RWA evidence and Proceed receipt vector as the contract", () => {
  const evidenceSet = buildRwaEvidenceSet();
  const receipt = createProceedReceiptDraft({
    reviewerWallet: "0x00000000000000000000000000000000000A11cE",
    decidedAt: 1782087000,
    nonce: "0x000000000000000000000000000000000000000000000000000000000000002a",
  });

  assert.deepEqual(evidenceSet.signals.map((signal) => signal.sourceAnchor), [
    "US-CLAIM-01",
    "HK-CLAIM-01",
    "SG-CLAIM-01",
    "EU-CLAIM-02",
  ]);
  assert.equal(receipt.evidenceHash, "0xca5dccebece8efc19059b681fab04f4b2f9465d74907df73a3f2aae0b9a3734d");
  assert.equal(receipt.productRefHash, "0x0e2a67482db97d22a92681869a6cc6c3e8a2efd19d51cd49c239539a7006c841");
  assert.equal(receipt.receiptHash, "0xe6de73d7431ac4d0f0519630daa438a9ae54080f7ba2059bee8938e71331e591");
});

test("rejects a malformed reviewer wallet before a receipt can be prepared", () => {
  assert.throws(
    () => createProceedReceiptDraft({
      reviewerWallet: "not-a-wallet",
      decidedAt: 1782087000,
      nonce: "0x000000000000000000000000000000000000000000000000000000000000002a",
    }),
    /wallet/i,
  );
});
