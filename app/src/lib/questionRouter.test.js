import assert from "node:assert/strict";
import test from "node:test";

import { getReviewedQuestionRoute } from "./questionRouter.js";

test("routes the default cross-border OUSG question to the comparative evidence map", () => {
  assert.deepEqual(
    getReviewedQuestionRoute("We're launching a tokenized US Treasury (OUSG) product, where can we legally offer and transfer it?"),
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
});
