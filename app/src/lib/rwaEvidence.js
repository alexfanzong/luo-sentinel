// Derived from LUO's reviewed Ondo OUSG RWA sample (2026-06-07).
// These are scoped evidence signals, not jurisdiction-wide legal conclusions.
export const RWA_EVIDENCE = Object.freeze([
  {
    id: "US-CLAIM-01",
    title: "United States",
    signal: "Restricted",
    detail: "The Rule 506(c) frame requires accredited-investor verification.",
    tone: "coral",
    className: "marker marker--us",
  },
  {
    id: "HK-CLAIM-01",
    title: "Hong Kong",
    signal: "Conditional",
    detail: "Retail secondary trading depends on a licensed channel and controls.",
    tone: "gold",
    className: "marker marker--hong-kong",
  },
  {
    id: "SG-CLAIM-01",
    title: "Singapore",
    signal: "Conditional",
    detail: "The current source pack supports only a narrow restricted-CIS context.",
    tone: "gold",
    className: "marker marker--singapore",
  },
  {
    id: "EU-CLAIM-02",
    title: "European Union",
    signal: "Unresolved",
    detail: "The current source pack does not establish an OUSG-specific classification.",
    tone: "blue",
    className: "marker marker--european-union",
  },
]);
