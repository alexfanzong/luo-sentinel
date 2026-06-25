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

test("keeps the evidence copy scoped to the cited source instead of asserting a universal offer path", () => {
  const [unitedStates, hongKong, singapore, europeanUnion] = RWA_EVIDENCE;

  assert.doesNotMatch(unitedStates.summary, /No retail distribution without further registration/i);
  assert.doesNotMatch(hongKong.summary, /possible only through/i);
  assert.match(singapore.sourceLabel, /specific provision required/i);
  assert.equal(europeanUnion.secondarySourceLabel, "EU · MiFID II 2014/65/EU");
  assert.equal(europeanUnion.secondarySourceUrl, "https://eur-lex.europa.eu/eli/dir/2014/65/oj");
});

test("links Hong Kong to the SFC tokenised-securities circular, not an AML circular", () => {
  const hongKong = RWA_EVIDENCE.find((item) => item.id === "HK-CLAIM-01");

  assert.equal(hongKong.sourceUrl, "https://apps.sfc.hk/edistributionWeb/gateway/EN/circular/doc?refNo=23EC52");
  assert.doesNotMatch(hongKong.sourceUrl, /23EC56/);
});
