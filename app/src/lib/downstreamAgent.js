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

export function runBoundedDownstreamAgent({ handoffFacts }) {
  requireApprovedHandoff(handoffFacts);

  const objections = agentObjections(handoffFacts);
  const hkOnly = handoffFacts.reviewScope === "Hong Kong · single jurisdiction";

  if (hkOnly) {
    return {
      mode: "bounded-deterministic-executor",
      title: "Counsel preparation checklist",
      summary: `${handoffFacts.caseRef}: Hong Kong-only handoff consumed inside the approved source scope.`,
      checklist: [
        "Review the SFC tokenised-securities circular against the actual product facts.",
        "Confirm whether the product is treated as a tokenised security in Hong Kong.",
        "Map any licensed intermediary involvement before distribution or transfer.",
        "Prepare suitability, onboarding, custody and transfer-control questions for counsel.",
        "Attach product rights, redemption mechanics and wallet-control design to the counsel packet.",
      ],
      constraints: [
        "Do not infer United States, Singapore, or EU coverage from this handoff.",
        "Do not create an offer, transfer, or compliance conclusion from this checklist.",
        ...objections,
      ],
    };
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
