import assert from "node:assert/strict";
import test from "node:test";

import { RWA_EVIDENCE } from "./rwaEvidence.js";

test("uses the verified Ondo RWA sample jurisdictions instead of the Tornado Cash set", () => {
  assert.deepEqual(
    RWA_EVIDENCE.map((item) => item.title),
    ["United States", "Hong Kong", "Singapore", "European Union"],
  );
  assert.equal(RWA_EVIDENCE.some((item) => item.title === "Switzerland"), false);
});

test("keeps each RWA homepage signal tied to its reviewed source anchor", () => {
  assert.deepEqual(
    RWA_EVIDENCE.map((item) => item.id),
    ["US-CLAIM-01", "HK-CLAIM-01", "SG-CLAIM-01", "EU-CLAIM-02"],
  );
});
