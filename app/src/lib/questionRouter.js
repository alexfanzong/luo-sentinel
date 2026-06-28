import { RWA_EVIDENCE } from "./rwaEvidence.js";

const REVIEWED_ASSET_PATTERN = /(ousg|tokeniz(?:ed)? treasury|treasury product|\brwa\b)/;
const COMPARATIVE_SCOPE_PATTERN = /(jurisdiction|cross[ -]?border|offer|transfer|market|where|sell|distribut|abroad|four|issue|mint|execute|deploy)/;

const JURISDICTION_PATTERNS = Object.freeze({
  "US-CLAIM-01": /\b(us|u\.s\.|united states|america|american)\b/,
  "HK-CLAIM-01": /\b(hk|hong kong)\b/,
  "SG-CLAIM-01": /\b(sg|singapore)\b/,
  "EU-CLAIM-02": /\b(eu|europe|european union)\b/,
});

// Named jurisdictions that are outside the reviewed evidence pack. If a question
// points at one of these (and matches no reviewed jurisdiction), it must be
// refused rather than routed to the comparative map; comparative intent alone
// ("offer", "where", "transfer") is not enough to invent coverage we don't have.
const UNREVIEWED_JURISDICTION_PATTERN =
  /\b(switzerland|swiss|brazil|brasil|uk|u\.k\.|britain|england|japan|china|chinese|india|indian|canada|canadian|australia|mexico|argentina|nigeria|russia|dubai|uae|qatar|saudi|korea|korean|vietnam|thailand|indonesia|philippines|malaysia|turkey)\b/;

export function getReviewedQuestionRoute(question) {
  const q = (question || "").trim().toLowerCase();
  if (!q || !REVIEWED_ASSET_PATTERN.test(q)) return null;

  const jurisdictionText = q.replace(/\bu\.?s\.?\s+treasury\b/g, "treasury");
  const comparativeIntent = COMPARATIVE_SCOPE_PATTERN.test(q);
  const matchedJurisdictions = RWA_EVIDENCE.filter((item) => JURISDICTION_PATTERNS[item.id]?.test(jurisdictionText));
  const singleJurisdictionHint = /\b(only|just|single|solely)\b/.test(q) || !comparativeIntent;

  // A question that names a jurisdiction outside the reviewed pack, and no
  // reviewed jurisdiction, is outside scope. Refuse it even when comparative
  // intent is present, so we never fabricate coverage for an unreviewed market.
  if (matchedJurisdictions.length === 0 && UNREVIEWED_JURISDICTION_PATTERN.test(jurisdictionText)) {
    return null;
  }

  if (matchedJurisdictions.length === 1 && singleJurisdictionHint) {
    return { scopeType: "single-jurisdiction", jurisdictionId: matchedJurisdictions[0].id };
  }

  if (comparativeIntent || matchedJurisdictions.length > 1) {
    return { scopeType: "comparative", jurisdictionId: null };
  }

  return null;
}
