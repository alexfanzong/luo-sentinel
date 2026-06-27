import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const APP_URL = new URL("../App.jsx", import.meta.url);

function appSource() {
  return readFileSync(fileURLToPath(APP_URL), "utf8");
}

test("shows a source-bounded action plan instead of a lead-market recommendation", () => {
  const source = appSource();

  assert.match(source, /What Sentinel held/);
  assert.match(source, /Run the review/);
  assert.match(source, /Take to local counsel/);
  assert.doesNotMatch(source, /Suggested lead market/);
  assert.doesNotMatch(source, /Most actionable/);
});

test("explains that the map is a reviewed evidence snapshot", () => {
  const source = appSource();

  assert.match(source, /RWA_EVIDENCE_PROVENANCE/);
  assert.match(source, /Last reviewed/);
  assert.match(source, /Refresh required when primary sources change/);
  assert.match(source, /not a live legal conclusion/);
});

test("stores the verified deployment address after a successful contract deployment", () => {
  const source = appSource();

  assert.match(source, /const contractAddress = await receiptAnchorClient\.waitForDeployedContract/);
  assert.doesNotMatch(source, /contractAddress:\s*mined\.contractAddress/);
  assert.match(source, /status:\s*"deployed",\s*contractAddress,/s);
  assert.doesNotMatch(source, /existingDeploymentAddress/);
  assert.doesNotMatch(source, /0xc7AE2D5e83d5Fc3fC05e618E60807E05D5E57e15/);
  assert.match(source, /Review contract deployment/);
  assert.match(source, /Confirm deployment in wallet/);
});

test("routes the selected scope through the agent review council before a receipt is prepared", () => {
  const source = appSource();

  assert.match(source, /buildReviewCouncil/);
  assert.match(source, /Agent Review Council/);
  assert.match(source, /Scores are audit weights, not AI confidence/);
  assert.match(source, /Scope.*\/100/s);
  assert.match(source, /Source fit.*\/100/s);
  assert.match(source, /reviewScopeIds:\s*reviewScope\.evidenceIds/);
  assert.match(source, /agentReviews:\s*reviewCouncil\.scorecards/);
  assert.doesNotMatch(source, /4-jurisdiction review scope/);
});

test("shows deployment polling progress and verifies the full anchored receipt", () => {
  const source = appSource();

  assert.match(source, /Waiting for deployment visibility/);
  assert.match(source, /onAttempt:\s*\(\{ attempt, attempts, contractAddress \}\)/);
  assert.match(source, /Review the receipt anchor next/);
  assert.doesNotMatch(source, /Prepare a fresh Proceed receipt/);
  assert.match(source, /expectedReceipt:\s*receipt/);
  assert.match(source, /record\.decidedAt !== receipt\.decidedAt/);
  assert.match(source, /record\.productRefHash !== receipt\.productRefHash/);
});

test("lets the bounded downstream agent consume the handoff in step five", () => {
  const source = appSource();

  assert.match(source, /runBoundedDownstreamAgent/);
  assert.match(source, /buildHandoffFacts/);
  assert.match(source, /Run counsel-prep agent/);
  assert.match(source, /Counsel preparation checklist/);
});

test("frames the demo as a preflight for a proposed Injective financial action", () => {
  const source = appSource();

  assert.match(source, /PROPOSED_FINANCIAL_ACTION/);
  assert.match(source, /Proposed tokenized treasury action/);
  assert.match(source, /Injective EVM testnet/);
  assert.match(source, /Held by Sentinel\. Nothing executed/);
  assert.match(source, /Held · nothing is executed until you decide/);
  assert.match(source, /do not execute a transfer, order, strategy, or asset movement from this handoff alone/);
  assert.doesNotMatch(source, /Injective RWA market/);
});
