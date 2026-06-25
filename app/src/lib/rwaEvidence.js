// Derived from LUO's reviewed Ondo OUSG RWA sample (2026-06-07).
// These are scoped evidence signals, not jurisdiction-wide legal conclusions.
export const RWA_EVIDENCE_PROVENANCE = Object.freeze({
  packLabel: "Reviewed OUSG evidence pack",
  reviewedAt: "2026-06-07",
  sourceType: "Human-reviewed source anchors",
  refreshPolicy: "Refresh when primary sources change; stale signals must be re-reviewed before use.",
});

export const RWA_EVIDENCE = Object.freeze([
  {
    id: "US-CLAIM-01",
    title: "United States",
    signal: "Restricted",
    detail: "The Rule 506(c) frame requires accredited-investor verification.",
    summary:
      "The cited Rule 506(c) provision permits general solicitation only if all purchasers are verified accredited investors. It is a candidate U.S. workstream, not a conclusion for any particular offer or transfer.",
    sourceLabel: "eCFR · Rule 506(c) · 17 CFR §230.506",
    sourceUrl: "https://www.ecfr.gov/current/title-17/section-230.506",
    tone: "coral",
    className: "marker marker--us",
  },
  {
    id: "HK-CLAIM-01",
    title: "Hong Kong",
    signal: "Conditional",
    detail: "Tokenised-securities activity requires a licensed-intermediary and product-control assessment.",
    summary:
      "The reviewed SFC circular addresses intermediary conduct around tokenised securities. It does not by itself establish a universal retail-transfer route; licensed distribution, suitability and custody/control conditions must be assessed for the concrete product.",
    sourceLabel: "SFC · tokenised-securities circular (Nov 2023)",
    sourceUrl: "https://apps.sfc.hk/edistributionWeb/gateway/EN/circular/doc?refNo=23EC52",
    tone: "gold",
    className: "marker marker--hong-kong",
  },
  {
    id: "SG-CLAIM-01",
    title: "Singapore",
    signal: "Conditional",
    detail: "The current source pack identifies only a narrow CIS-related evidence thread.",
    summary:
      "The linked statute is a starting point, not a verified offer-path conclusion. This demo does not identify a specific SFA or MAS provision supporting a broader offering.",
    sourceLabel: "Singapore · Securities & Futures Act 2001 (specific provision required)",
    sourceUrl: "https://sso.agc.gov.sg/Act/SFA2001",
    tone: "gold",
    className: "marker marker--singapore",
  },
  {
    id: "EU-CLAIM-02",
    title: "European Union",
    signal: "Unresolved",
    detail: "The current source pack does not establish an OUSG-specific classification.",
    summary:
      "MiCA alone does not resolve whether this product is a financial instrument; the current demo pack does not establish an OUSG-specific classification. A MiFID II and local-law assessment remains required.",
    sourceLabel: "EU · MiCA Regulation 2023/1114",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
    secondarySourceLabel: "EU · MiFID II 2014/65/EU",
    secondarySourceUrl: "https://eur-lex.europa.eu/eli/dir/2014/65/oj",
    tone: "blue",
    className: "marker marker--european-union",
  },
]);
