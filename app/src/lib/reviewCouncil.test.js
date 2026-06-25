import assert from "node:assert/strict";
import test from "node:test";

import { buildReviewCouncil, createReviewScope } from "./reviewCouncil.js";

test("builds a comparative review scope across every reviewed jurisdiction", () => {
  const scope = createReviewScope();
  const council = buildReviewCouncil(scope);

  assert.equal(scope.scopeType, "comparative");
  assert.deepEqual(scope.evidenceIds, ["US-CLAIM-01", "HK-CLAIM-01", "SG-CLAIM-01", "EU-CLAIM-02"]);
  assert.equal(council.scorecards.length, 3);
  assert.equal(council.scorecards[0].agentId, "scope-agent");
  assert.match(council.scorecards[0].focus, /jurisdiction coverage/i);
  assert.equal(council.aggregate.gate, "human-review-required");
});

test("shrinks the review council to source and applicability checks for one jurisdiction", () => {
  const scope = createReviewScope("HK-CLAIM-01");
  const council = buildReviewCouncil(scope);

  assert.equal(scope.scopeType, "single-jurisdiction");
  assert.deepEqual(scope.evidenceIds, ["HK-CLAIM-01"]);
  assert.deepEqual(scope.jurisdictions, ["Hong Kong"]);
  assert.match(council.scorecards[0].focus, /authority coverage/i);
  assert.match(council.scorecards[1].findings.join(" "), /SFC circular/i);
  assert.equal(council.aggregate.mode, "source-and-applicability-review");
});

test("explains that review scores come from deterministic rubric adjustments", () => {
  const council = buildReviewCouncil(createReviewScope("HK-CLAIM-01"));

  assert.match(council.scorecards[0].scoringBasis, /starts at 100/i);
  assert.match(council.scorecards[1].scoringBasis, /product-specific facts/i);
  assert.match(council.aggregate.scoringBasis, /audit weights start at 100/i);
});

test("uses Hong Kong-specific source copy only for the Hong Kong reviewer", () => {
  const hongKongCouncil = buildReviewCouncil(createReviewScope("HK-CLAIM-01"));
  const usCouncil = buildReviewCouncil(createReviewScope("US-CLAIM-01"));

  assert.match(hongKongCouncil.scorecards[1].findings.join(" "), /For Hong Kong, the SFC circular/);
  assert.doesNotMatch(usCouncil.scorecards[1].findings.join(" "), /For Hong Kong/);
  assert.match(usCouncil.scorecards[1].findings.join(" "), /For United States, the cited source supports a scoped inquiry only/);
});
