import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRwaEvidenceSet,
  createProceedReceiptDraft,
  getSafeDecisionTimestamp,
} from "./onchainReceipt.js";
import { buildReviewCouncil, createReviewScope } from "./reviewCouncil.js";

test("backs the decision timestamp off by one minute to avoid testnet clock skew", () => {
  assert.equal(getSafeDecisionTimestamp(1782087000), 1782086940);
});

test("binds one cross-border scenario to the full reviewed jurisdiction scope", () => {
  const evidenceSet = buildRwaEvidenceSet({ caseRef: "RWA-DEMO-001" });
  const receipt = createProceedReceiptDraft({
    reviewerWallet: "0x00000000000000000000000000000000000A11cE",
    decidedAt: 1782087000,
    nonce: "0x000000000000000000000000000000000000000000000000000000000000002a",
    caseRef: "RWA-DEMO-001",
  });

  assert.deepEqual(evidenceSet.signals.map((signal) => signal.sourceAnchor), [
    "US-CLAIM-01",
    "HK-CLAIM-01",
    "SG-CLAIM-01",
    "EU-CLAIM-02",
  ]);
  assert.deepEqual(evidenceSet.decision, {
    caseRef: "RWA-DEMO-001",
    reviewScope: ["US-CLAIM-01", "HK-CLAIM-01", "SG-CLAIM-01", "EU-CLAIM-02"],
  });
  assert.equal(receipt.evidenceSet.decision.caseRef, "RWA-DEMO-001");
  assert.equal(receipt.evidenceSet.decision.reviewScope.length, 4);
  assert.equal(receipt.evidenceHash, "0xd3f1445b3056ff6df2ff807470a73de05a954f6f0b3a6e84514174f8406c1feb");
  assert.equal(receipt.productRefHash, "0x0e2a67482db97d22a92681869a6cc6c3e8a2efd19d51cd49c239539a7006c841");
  assert.equal(receipt.receiptHash, "0x62a3ba15af26a092095f1580b084d0142b6c551b57bdf74b97c98b7d1949bc15");

  const anotherReceipt = createProceedReceiptDraft({
    reviewerWallet: "0x00000000000000000000000000000000000A11cE",
    decidedAt: 1782087000,
    nonce: "0x000000000000000000000000000000000000000000000000000000000000002a",
    caseRef: "RWA-DEMO-002",
  });
  assert.notEqual(receipt.evidenceHash, anotherReceipt.evidenceHash);
  assert.notEqual(receipt.receiptHash, anotherReceipt.receiptHash);
});

test("rejects a scenario reference that could contain free-form sensitive data", () => {
  assert.throws(
    () => createProceedReceiptDraft({
      reviewerWallet: "0x00000000000000000000000000000000000A11cE",
      decidedAt: 1782087000,
      nonce: "0x000000000000000000000000000000000000000000000000000000000000002a",
      caseRef: "alice@example.com",
    }),
    /scenario reference/i,
  );
});

test("binds a single-jurisdiction decision to only the selected source scope and reviewer scorecards", () => {
  const scope = createReviewScope("HK-CLAIM-01");
  const council = buildReviewCouncil(scope);
  const evidenceSet = buildRwaEvidenceSet({
    caseRef: "HK-ONLY-001",
    reviewScopeIds: scope.evidenceIds,
    agentReviews: council.scorecards,
  });
  const receipt = createProceedReceiptDraft({
    reviewerWallet: "0x00000000000000000000000000000000000A11cE",
    decidedAt: 1782087000,
    nonce: "0x000000000000000000000000000000000000000000000000000000000000002a",
    caseRef: "HK-ONLY-001",
    reviewScopeIds: scope.evidenceIds,
    agentReviews: council.scorecards,
  });

  assert.deepEqual(evidenceSet.signals.map((signal) => signal.sourceAnchor), ["HK-CLAIM-01"]);
  assert.deepEqual(evidenceSet.decision.reviewScope, ["HK-CLAIM-01"]);
  assert.equal(evidenceSet.agentReviews.length, 3);
  assert.equal(evidenceSet.agentReviews[1].agentId, "source-agent");
  assert.match(evidenceSet.agentReviews[1].findings.join(" "), /SFC circular/i);
  assert.equal(receipt.evidenceSet.signals.length, 1);
  assert.equal(receipt.evidenceSet.agentReviews.length, 3);
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
