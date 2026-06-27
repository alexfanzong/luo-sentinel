import assert from "node:assert/strict";
import test from "node:test";

import { runBoundedDownstreamAgent } from "./downstreamAgent.js";

test("turns a cross-border handoff into a bounded counsel preparation checklist", () => {
  const result = runBoundedDownstreamAgent({
    handoffFacts: {
      caseRef: "RWA-DEMO-001",
      reviewScope: "Cross-border · US · HK · SG · EU",
      reviewMode: "jurisdiction-comparison-review",
      signals: {
        "US-CLAIM-01": "Restricted",
        "HK-CLAIM-01": "Conditional",
        "EU-CLAIM-02": "Unresolved",
      },
      agentReviews: [{ agentId: "risk-agent", objections: ["Human acknowledgement is required."] }],
      decision: "PROCEED",
      riskAcknowledged: true,
    },
  });

  assert.equal(result.mode, "bounded-deterministic-executor");
  assert.match(result.summary, /RWA-DEMO-001/);
  assert.ok(result.checklist.some((item) => /Rule 506\(c\)/.test(item)));
  assert.ok(result.checklist.some((item) => /Hong Kong/.test(item)));
  assert.ok(result.checklist.some((item) => /Do not infer EU classification/.test(item)));
});

test("keeps a Hong Kong-only handoff inside Hong Kong source scope", () => {
  const result = runBoundedDownstreamAgent({
    handoffFacts: {
      caseRef: "HK-ONLY-001",
      reviewScope: "Hong Kong · single jurisdiction",
      reviewMode: "source-and-applicability-review",
      signals: {
        "HK-CLAIM-01": "Conditional",
      },
      agentReviews: [{ agentId: "source-agent", objections: ["Product terms still need counsel review."] }],
      decision: "PROCEED",
      riskAcknowledged: true,
    },
  });

  assert.ok(result.checklist.some((item) => /SFC tokenised-securities circular/.test(item)));
  assert.ok(result.checklist.some((item) => /licensed intermediary/.test(item)));
  assert.ok(result.constraints.some((item) => /Do not infer United States, Singapore, or EU coverage/.test(item)));
  assert.equal(result.checklist.some((item) => /Rule 506\(c\)/.test(item)), false);
});

test("keeps a Singapore-only handoff inside Singapore scope without inferring U.S. coverage", () => {
  const result = runBoundedDownstreamAgent({
    handoffFacts: {
      caseRef: "SG-ONLY-001",
      reviewScope: "Singapore · single jurisdiction",
      reviewMode: "source-and-applicability-review",
      scopeType: "single-jurisdiction",
      evidenceIds: ["SG-CLAIM-01"],
      signals: { "SG-CLAIM-01": "Conditional" },
      decision: "PROCEED",
      riskAcknowledged: true,
    },
  });

  assert.match(result.summary, /Singapore-only/);
  assert.ok(result.checklist.some((item) => /SFA Part 13 provision/.test(item)));
  // The core boundary: a single-jurisdiction handoff must not leak other markets.
  assert.equal(result.checklist.some((item) => /Rule 506\(c\)/.test(item)), false);
  assert.ok(result.constraints.some((item) => /Do not infer United States, Hong Kong, or EU coverage/.test(item)));
});

test("refuses to run without a human-approved Proceed handoff", () => {
  assert.throws(
    () => runBoundedDownstreamAgent({
      handoffFacts: {
        caseRef: "HOLD-001",
        reviewScope: "Hong Kong · single jurisdiction",
        reviewMode: "source-and-applicability-review",
        signals: { "HK-CLAIM-01": "Conditional" },
        decision: "HOLD",
        riskAcknowledged: false,
      },
    }),
    /human-approved Proceed handoff/i,
  );
});
