// Derived from LUO's reviewed Ondo OUSG RWA sample (2026-06-07).
// These are scoped evidence signals, not jurisdiction-wide legal conclusions.
export const RWA_EVIDENCE = Object.freeze([
  {
    id: "US-CLAIM-01",
    title: "United States",
    signal: "Restricted",
    detail: "The Rule 506(c) frame requires accredited-investor verification.",
    summary:
      "Offered under a private-placement exemption: general solicitation is allowed, but every purchaser must be a verified accredited investor. No retail distribution without further registration.",
    sourceLabel: "SEC · Rule 506(c) · 17 CFR §230.506",
    sourceUrl: "https://www.ecfr.gov/current/title-17/section-230.506",
    tone: "coral",
    className: "marker marker--us",
  },
  {
    id: "HK-CLAIM-01",
    title: "Hong Kong",
    signal: "Conditional",
    detail: "Retail secondary trading depends on a licensed channel and controls.",
    summary:
      "Secondary transfer to retail is possible only through an SFC-licensed channel meeting tokenised-product conduct and custody controls. Outside that channel it stays professional-investor only.",
    sourceLabel: "SFC · tokenised-securities circular (Nov 2023)",
    sourceUrl: "https://apps.sfc.hk/edistributionWeb/gateway/EN/circular/doc?refNo=23EC56",
    tone: "gold",
    className: "marker marker--hong-kong",
  },
  {
    id: "SG-CLAIM-01",
    title: "Singapore",
    signal: "Conditional",
    detail: "The current source pack supports only a narrow restricted-CIS context.",
    summary:
      "Reviewed sources support only a narrow restricted collective-investment-scheme context. Broader retail offering would need additional MAS authorisation not covered by this evidence pack.",
    sourceLabel: "Singapore · Securities & Futures Act 2001",
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
      "Reviewed sources do not yet establish an OUSG-specific classification under MiCA / MiFID. Treatment is unresolved, so the agent surfaces the gap rather than asserting a position.",
    sourceLabel: "EU · MiCA Regulation 2023/1114",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
    tone: "blue",
    className: "marker marker--european-union",
  },
]);
