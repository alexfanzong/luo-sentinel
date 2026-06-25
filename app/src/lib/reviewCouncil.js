import { RWA_EVIDENCE } from "./rwaEvidence.js";

const DEFAULT_SCOPE_IDS = RWA_EVIDENCE.map((item) => item.id);

function getEvidenceById(id) {
  return RWA_EVIDENCE.find((item) => item.id === id);
}

export function createReviewScope(jurisdictionId = null) {
  if (jurisdictionId) {
    const item = getEvidenceById(jurisdictionId);
    if (!item) throw new Error("Unknown reviewed jurisdiction.");

    return {
      scopeType: "single-jurisdiction",
      label: `${item.title} · single jurisdiction`,
      evidenceIds: [item.id],
      jurisdictions: [item.title],
      reviewMode: "source-and-applicability-review",
    };
  }

  return {
    scopeType: "comparative",
    label: "Cross-border · US · HK · SG · EU",
    evidenceIds: DEFAULT_SCOPE_IDS,
    jurisdictions: RWA_EVIDENCE.map((item) => item.title),
    reviewMode: "jurisdiction-comparison-review",
  };
}

function scorecard({ agentId, name, role, focus, verdict, scores, scoringBasis, findings, objections }) {
  return { agentId, name, role, focus, verdict, scores, scoringBasis, findings, objections };
}

function buildComparativeScorecards(scope) {
  return [
    scorecard({
      agentId: "scope-agent",
      name: "Scope Agent",
      role: "Coverage reviewer",
      focus: "Jurisdiction coverage and comparison boundaries",
      verdict: "warn",
      scores: { coverage: 82, authorityFit: 76, claimSupport: 70, residualRisk: 64 },
      scoringBasis: "Starts at 100; deducts for unresolved EU classification and source boundaries that do not authorize an offer or transfer.",
      findings: [
        "The evidence pack covers four reviewed jurisdictions, but each signal remains source-scoped.",
        "The map can compare conditions; it cannot select a market or authorize transfer.",
      ],
      objections: ["EU classification remains unresolved in the current pack."],
    }),
    scorecard({
      agentId: "source-agent",
      name: "Source Agent",
      role: "Authority reviewer",
      focus: "Primary source support for each mapped claim",
      verdict: "warn",
      scores: { coverage: 78, authorityFit: 84, claimSupport: 72, residualRisk: 58 },
      scoringBasis: "Starts at 100; source fit stays higher because claims are anchored, while support is reduced where Singapore/EU need provision-level follow-up.",
      findings: [
        "Each signal is tied to a source anchor instead of a generalized legal conclusion.",
        "Singapore and EU require narrower provision-level follow-up before any broader claim.",
      ],
      objections: ["Secondary-transfer controls are not resolved by the current source pack."],
    }),
    scorecard({
      agentId: "risk-agent",
      name: "Risk Agent",
      role: "Human gate reviewer",
      focus: "Operational risk before any downstream action",
      verdict: "warn",
      scores: { coverage: 80, authorityFit: 80, claimSupport: 68, residualRisk: 66 },
      scoringBasis: "Starts at 100; deducts because the output is only a counsel-preparation workstream and cannot authorize downstream execution.",
      findings: [
        "Proceed only as a preparation workstream for counsel review.",
        "Do not let a downstream agent infer offer eligibility from the map.",
      ],
      objections: ["Human acknowledgement is required before anchoring a decision receipt."],
    }),
  ];
}

function buildSingleJurisdictionScorecards(scope) {
  const jurisdiction = scope.jurisdictions[0];
  const item = getEvidenceById(scope.evidenceIds[0]);

  return [
    scorecard({
      agentId: "scope-agent",
      name: "Scope Agent",
      role: "Depth reviewer",
      focus: "Authority coverage inside one jurisdiction",
      verdict: "warn",
      scores: { coverage: 68, authorityFit: 82, claimSupport: 70, residualRisk: 62 },
      scoringBasis: "Starts at 100; deducts because one selected source narrows coverage, while source fit stays higher for a regulator-facing source.",
      findings: [
        `${jurisdiction} is the only active scope; other jurisdictions must not be inferred.`,
        "The review shifts from cross-border comparison to depth of authority and issue coverage.",
      ],
      objections: ["One source signal is not a complete jurisdiction-wide legal assessment."],
    }),
    scorecard({
      agentId: "source-agent",
      name: "Source Agent",
      role: "Source verifier",
      focus: "Source correctness and claim support",
      verdict: "warn",
      scores: { coverage: 64, authorityFit: 86, claimSupport: 72, residualRisk: 60 },
      scoringBasis: "Starts at 100; source fit stays high for the selected anchor, while claim support is reduced because product-specific facts are still missing.",
      findings: [
        `${item.sourceLabel} is the active source anchor.`,
        item.id === "HK-CLAIM-01"
          ? "For Hong Kong, the SFC circular supports a licensed-intermediary/product-control inquiry, not a universal transfer conclusion."
          : `For ${jurisdiction}, the cited source supports a scoped inquiry only, not a universal transfer conclusion.`,
      ],
      objections: ["Product terms, client type, distribution channel and custody controls still need counsel review."],
    }),
    scorecard({
      agentId: "risk-agent",
      name: "Risk Agent",
      role: "Human gate reviewer",
      focus: "Applicability risk before action",
      verdict: "warn",
      scores: { coverage: 66, authorityFit: 78, claimSupport: 68, residualRisk: 64 },
      scoringBasis: "Starts at 100; deducts until product terms, client type, channel, and custody controls are reviewed by counsel.",
      findings: [
        "Proceed only as a scoped local-counsel workstream.",
        "The handoff must bind the downstream agent to the selected jurisdiction only.",
      ],
      objections: ["No automated compliance determination should be created from this source alone."],
    }),
  ];
}

export function buildReviewCouncil(scope) {
  const scorecards =
    scope.scopeType === "single-jurisdiction"
      ? buildSingleJurisdictionScorecards(scope)
      : buildComparativeScorecards(scope);

  return {
    mode: "deterministic-demo-reviewers",
    scorecards,
    aggregate: {
      verdict: "warn",
      gate: "human-review-required",
      mode: scope.reviewMode,
      disagreement: "low",
      scoringBasis: "Audit weights start at 100 and deduct for scope gaps, source limits, weak claim support, and residual risk.",
    },
  };
}
