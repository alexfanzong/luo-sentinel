import assert from "node:assert/strict";
import test from "node:test";

import { getReviewedQuestionRoute } from "./questionRouter.js";

test("routes the default cross-border OUSG question to the comparative evidence map", () => {
  assert.deepEqual(
    getReviewedQuestionRoute("We're launching a tokenized US Treasury (OUSG) product, where can we legally offer and transfer it?"),
    { scopeType: "comparative", jurisdictionId: null },
  );

  assert.deepEqual(
    getReviewedQuestionRoute("Agent request: issue OUSG on Injective"),
    { scopeType: "comparative", jurisdictionId: null },
  );
});

test("routes a Hong Kong-only OUSG question directly to the Hong Kong evidence scope", () => {
  assert.deepEqual(
    getReviewedQuestionRoute("Can we launch OUSG in Hong Kong only?"),
    { scopeType: "single-jurisdiction", jurisdictionId: "HK-CLAIM-01" },
  );

  assert.deepEqual(
    getReviewedQuestionRoute("Can we offer OUSG in Hong Kong only?"),
    { scopeType: "single-jurisdiction", jurisdictionId: "HK-CLAIM-01" },
  );
});

test("does not treat US Treasury as a single United States jurisdiction request", () => {
  assert.deepEqual(
    getReviewedQuestionRoute("Where can we offer an OUSG tokenized US Treasury product?"),
    { scopeType: "comparative", jurisdictionId: null },
  );
});

test("refuses questions outside the reviewed OUSG evidence pack", () => {
  assert.equal(getReviewedQuestionRoute("Can we launch a meme coin in Brazil?"), null);
  assert.equal(getReviewedQuestionRoute("Can we launch OUSG in Switzerland?"), null);
});

test("refuses an OUSG question that targets a named but unreviewed jurisdiction", () => {
  // Comparative intent ("offer"/"where") must not invent coverage for a
  // jurisdiction the evidence pack never reviewed (Switzerland).
  assert.equal(getReviewedQuestionRoute("Can we offer OUSG in Switzerland only?"), null);
  assert.equal(getReviewedQuestionRoute("Where can we offer OUSG in Switzerland?"), null);
});

test("routes the full first-page comparative question set to the four-jurisdiction map", () => {
  const comparative = { scopeType: "comparative", jurisdictionId: null };
  assert.deepEqual(
    getReviewedQuestionRoute("Prepare an OUSG-like tokenized treasury asset for Injective issuance or transfer."),
    comparative,
  );
  assert.deepEqual(getReviewedQuestionRoute("Where can we offer an OUSG tokenized US Treasury product?"), comparative);
});

test("routes the full first-page single-jurisdiction question set to the Hong Kong scope", () => {
  const hongKong = { scopeType: "single-jurisdiction", jurisdictionId: "HK-CLAIM-01" };
  assert.deepEqual(getReviewedQuestionRoute("Prepare the OUSG Sentinel review for Hong Kong only."), hongKong);
  assert.deepEqual(getReviewedQuestionRoute("Can we launch OUSG in Hong Kong only?"), hongKong);
});
