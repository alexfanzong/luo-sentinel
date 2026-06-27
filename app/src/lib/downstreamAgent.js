function requireApprovedHandoff(handoffFacts) {
  if (!handoffFacts || handoffFacts.decision !== "PROCEED" || handoffFacts.riskAcknowledged !== true) {
    throw new Error("A human-approved Proceed handoff is required before the downstream agent can run.");
  }
}

function agentObjections(handoffFacts) {
  return (handoffFacts.agentReviews || [])
    .flatMap((review) => review.objections || [])
    .filter(Boolean);
}

// Per-jurisdiction counsel-prep plans. The bounded agent may only emit the plan
// for the jurisdiction that was actually approved; it must never infer coverage
// for a jurisdiction outside the reviewed single-source scope.
const SINGLE_JURISDICTION_PLANS = Object.freeze({
  "US-CLAIM-01": {
    jurisdiction: "United States",
    shortName: "United States",
    checklist: [
      "Prepare the Rule 506(c) accredited-investor verification workstream for U.S. counsel review.",
      "Collect Form D, Rule 506(d) bad-actor check, offering document and subscription workflow materials.",
      "Map state blue-sky notice filings and secondary-transfer controls for counsel.",
    ],
  },
  "HK-CLAIM-01": {
    jurisdiction: "Hong Kong",
    shortName: "Hong Kong",
    checklist: [
      "Review the SFC tokenised-securities circular against the actual product facts.",
      "Confirm whether the product is treated as a tokenised security in Hong Kong.",
      "Map any licensed intermediary involvement before distribution or transfer.",
      "Prepare suitability, onboarding, custody and transfer-control questions for counsel.",
      "Attach product rights, redemption mechanics and wallet-control design to the counsel packet.",
    ],
  },
  "SG-CLAIM-01": {
    jurisdiction: "Singapore",
    shortName: "Singapore",
    checklist: [
      "Identify the exact SFA or MAS provision relied on before making any broader claim.",
      "Map any collective-investment-scheme, prospectus or exemption requirements for the offer structure.",
      "Prepare the product and distribution facts a Singapore counsel review will need.",
    ],
  },
  "EU-CLAIM-02": {
    jurisdiction: "European Union",
    shortName: "EU",
    checklist: [
      "Assemble the product features needed for a MiFID II financial-instrument assessment.",
      "Prepare MiCA scope-analysis inputs and note that MiCA alone does not resolve classification.",
      "Request a member-state local-law review before any broader claim.",
    ],
  },
});

// Formats ["A", "B", "C"] as "A, B, or C" so the bounded constraint reads cleanly.
function formatExclusionList(names) {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} or ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, or ${names[names.length - 1]}`;
}

function isSingleJurisdiction(handoffFacts) {
  if (handoffFacts.scopeType === "single-jurisdiction") return true;
  // Fallback for older handoffs without scopeType: one signal == one jurisdiction.
  const ids = handoffFacts.evidenceIds || Object.keys(handoffFacts.signals || {});
  return ids.length === 1;
}

function singleJurisdictionResult(handoffFacts, objections) {
  const ids = handoffFacts.evidenceIds || Object.keys(handoffFacts.signals || {});
  const plan = SINGLE_JURISDICTION_PLANS[ids[0]];
  const jurisdiction = plan?.jurisdiction || handoffFacts.reviewScope || "the approved jurisdiction";
  const others = Object.entries(SINGLE_JURISDICTION_PLANS)
    .filter(([id]) => id !== ids[0])
    .map(([, entry]) => entry.shortName);

  return {
    mode: "bounded-deterministic-executor",
    title: "Counsel preparation checklist",
    summary: `${handoffFacts.caseRef}: ${jurisdiction}-only handoff consumed inside the approved source scope.`,
    checklist: plan
      ? plan.checklist
      : [
          `Review the ${jurisdiction} source anchor against the actual product facts.`,
          `Prepare the product, distribution and control questions a ${jurisdiction} counsel review will need.`,
        ],
    constraints: [
      `Do not infer ${formatExclusionList(others)} coverage from this handoff.`,
      "Do not create an offer, transfer, or compliance conclusion from this checklist.",
      ...objections,
    ],
  };
}

export function runBoundedDownstreamAgent({ handoffFacts }) {
  requireApprovedHandoff(handoffFacts);

  const objections = agentObjections(handoffFacts);

  if (isSingleJurisdiction(handoffFacts)) {
    return singleJurisdictionResult(handoffFacts, objections);
  }

  return {
    mode: "bounded-deterministic-executor",
    title: "Counsel preparation checklist",
    summary: `${handoffFacts.caseRef}: comparative handoff consumed with no expansion beyond reviewed source anchors.`,
    checklist: [
      "Prepare the Rule 506(c) accredited-investor verification workstream for U.S. counsel review.",
      "Collect Form D, bad-actor check, offering document and subscription workflow materials.",
      "Prepare the Hong Kong licensed-intermediary, product-control, suitability and custody questions.",
      "Flag Singapore as conditional: identify the exact MAS/SFA provision before any broader claim.",
      "Do not infer EU classification from the current source pack; request MiFID II/local-law review.",
    ],
    constraints: [
      "Do not select a lead market or authorize offer/transfer.",
      "Do not expand beyond the reviewed source anchors in the handoff.",
      ...objections,
    ],
  };
}
