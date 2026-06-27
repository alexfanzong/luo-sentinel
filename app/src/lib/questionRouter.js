import { RWA_EVIDENCE } from "./rwaEvidence.js";

const REVIEWED_ASSET_PATTERN = /(ousg|tokeniz(?:ed)? treasury|treasury product|\brwa\b)/;
const COMPARATIVE_SCOPE_PATTERN = /(jurisdiction|cross[ -]?border|offer|transfer|market|where|sell|distribut|abroad|four|issue|mint|execute|deploy)/;

const JURISDICTION_PATTERNS = Object.freeze({
  "US-CLAIM-01": /\b(us|u\.s\.|united states|america|american)\b/,
  "HK-CLAIM-01": /\b(hk|hong kong)\b/,
  "SG-CLAIM-01": /\b(sg|singapore)\b/,
  "EU-CLAIM-02": /\b(eu|europe|european union)\b/,
});

export function getReviewedQuestionRoute(question) {
  const q = (question || "").trim().toLowerCase();
  if (!q || !REVIEWED_ASSET_PATTERN.test(q)) return null;

  const jurisdictionText = q.replace(/\bu\.?s\.?\s+treasury\b/g, "treasury");
  const comparativeIntent = COMPARATIVE_SCOPE_PATTERN.test(q);
  const matchedJurisdictions = RWA_EVIDENCE.filter((item) => JURISDICTION_PATTERNS[item.id]?.test(jurisdictionText));
  const singleJurisdictionHint = /\b(only|just|single|solely)\b/.test(q) || !comparativeIntent;

  if (matchedJurisdictions.length === 1 && singleJurisdictionHint) {
    return { scopeType: "single-jurisdiction", jurisdictionId: matchedJurisdictions[0].id };
  }

  if (comparativeIntent || matchedJurisdictions.length > 1) {
    return { scopeType: "comparative", jurisdictionId: null };
  }

  return null;
}
