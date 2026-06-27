import { useState } from "react";
import { hexlify, randomBytes } from "ethers";
import { connectToInjectiveEvmTestnet, INJECTIVE_EVM_TESTNET } from "./lib/injectiveEvm.js";
import { createProceedReceiptDraft, getSafeDecisionTimestamp } from "./lib/onchainReceipt.js";
import { runBoundedDownstreamAgent } from "./lib/downstreamAgent.js";
import { buildReviewCouncil, createReviewScope } from "./lib/reviewCouncil.js";
import { RWA_EVIDENCE, RWA_EVIDENCE_PROVENANCE } from "./lib/rwaEvidence.js";
import { getReviewedQuestionRoute } from "./lib/questionRouter.js";

// The reviewed evidence pack the local agent is allowed to route to. The agent
// never answers freely: it either maps a question onto these human-verified
// source signals, or it refuses instead of fabricating a map.
// Deterministic, human-reviewed triage for the OUSG cross-border scenario.
// The local agent translates a bounded evidence pack into preparation work; it
// does not select a market or determine an offer path.
const ACTION_PLAN = {
  startHere: {
    text: "One suggested first workstream is the U.S. Rule 506(c) private-placement route for the reviewed U.S. source; the Hong Kong, Singapore and EU workstreams are covered per-source below. This is a scoped research starting point, not an eligibility or offering finding.",
    url: "https://www.ecfr.gov/current/title-17/section-230.506",
    label: "17 CFR §230.506",
  },
  materials: {
    need: [
      { text: "Accredited-investor verification design" },
      { text: "Form D filing workflow (if counsel confirms an exempt path)", url: "https://www.sec.gov/resources-small-businesses/exempt-offerings/filing-form-d-notice", label: "SEC · file Form D" },
      { text: "Offering and subscription materials" },
      { text: "Rule 506(d) bad-actor checks", url: "https://www.ecfr.gov/current/title-17/section-230.506", label: "17 CFR §230.506" },
    ],
    likelyHave: ["Product rights and token terms", "Entity and cap-table materials", "Intended jurisdictions and investor profile"],
    counsel: [
      "Whether Rule 506(c) or another route is available for the actual product",
      "Non-U.S. buyer treatment, state notices and secondary-transfer controls",
      "Hong Kong, Singapore and EU conditions or source gaps",
    ],
  },
};

const PROPOSED_FINANCIAL_ACTION = Object.freeze({
  label: "Proposed tokenized treasury action",
  network: "Injective EVM testnet",
  execution: "Held by Sentinel. Nothing executed",
  intent: "Prepare an OUSG-like tokenized asset for a downstream transfer or strategy workflow.",
  constraints: [
    ["Asset context", "Tokenized U.S. Treasury sample"],
    ["Execution layer", "Injective financial action, testnet only"],
    ["If released", "Downstream transfer or strategy"],
    ["Agent role", "Detect evidence gaps before execution"],
  ],
});

const SCOPE_SUMMARY_ORDER = ["US-CLAIM-01", "EU-CLAIM-02", "HK-CLAIM-01", "SG-CLAIM-01"];

// Procedural workstreams a reviewer can start BEFORE engaging counsel.
// Derived from the same reviewed source anchors in rwaEvidence.js; preparation steps, not legal conclusions.
const COUNSEL_PREP_TEMPLATES = Object.freeze({
  "US-CLAIM-01": {
    route: "Reg D private placement (Rule 506(c) candidate)",
    steps: [
      "Stand up the accredited-investor verification workflow (income or net-worth evidence, or third-party verification letters) required by Rule 506(c).",
      "Prepare the Form D notice for the SEC and check state blue-sky notice filings.",
      "Run the Rule 506(d) bad-actor disqualification check on all covered persons.",
      "Draft subscription agreement and offering materials for counsel to review.",
    ],
    confirm: "Whether Rule 506(c) or another exemption fits the actual product and buyer set.",
    templates: [
      { label: "SEC · file Form D (EDGAR, no fee)", url: "https://www.sec.gov/resources-small-businesses/exempt-offerings/filing-form-d-notice" },
      { label: "SEC · what is Form D / building blocks", url: "https://www.sec.gov/files/form-d-building-blocks.pdf" },
      { label: "SEC · Rule 506(d) bad-actor disqualification guide", url: "https://www.sec.gov/resources-small-businesses/small-business-compliance-guides/disqualification-felons-other-bad-actors-rule-506-offerings-related-disclosure-requirements" },
      { label: "eCFR · 17 CFR §230.506", url: "https://www.ecfr.gov/current/title-17/section-230.506" },
    ],
  },
  "HK-CLAIM-01": {
    route: "SFC tokenised-securities intermediary assessment",
    steps: [
      "Map which SFC regulated activities the product may trigger (for example Type 1 dealing or Type 4 advising).",
      "Confirm the licensed intermediary and the distribution channel for any offer.",
      "Prepare the suitability and client-onboarding workflow.",
      "Document custody, control and transfer-restriction design.",
    ],
    confirm: "Whether the product is a tokenised security on the actual facts, and which SFC conditions apply.",
    templates: [
      { label: "SFC · intermediaries in tokenised securities (23EC52)", url: "https://apps.sfc.hk/edistributionWeb/gateway/EN/circular/doc?refNo=23EC52" },
      { label: "SFC · tokenisation of authorised products (23EC53)", url: "https://apps.sfc.hk/edistributionWeb/gateway/EN/circular/doc?refNo=23EC53" },
    ],
  },
  "SG-CLAIM-01": {
    route: "Singapore SFA capital-markets-product assessment",
    steps: [
      "Classify whether the token is a capital markets product (security or CIS unit) on its economic substance, per MAS guidance.",
      "If it is a CMP, map the SFA Part 13 offer structure and the section 243 prospectus or exemption requirements.",
      "Prepare the complex-product distribution safeguards MAS expects for tokenised offers.",
    ],
    confirm: "Whether the token is a capital markets product on the actual facts, and which SFA offer route applies.",
    templates: [
      { label: "MAS · A Guide to Digital Token Offerings", url: "https://www.mas.gov.sg/regulation/explainers/a-guide-to-digital-token-offerings" },
      { label: "MAS · Guide on the Tokenisation of Capital Markets Products (PDF)", url: "https://www.mas.gov.sg/-/media/mas/sectors/guidance/guide-on-the-tokenisation-of-capital-markets-products.pdf" },
    ],
  },
  "EU-CLAIM-02": {
    route: "EU classification (MiCA with MiFID II)",
    steps: [
      "Assemble the product features needed for a MiFID II financial-instrument assessment.",
      "Prepare MiCA scope-analysis inputs and note that a token that is a MiFID II financial instrument is excluded from MiCA.",
    ],
    confirm: "Whether the product is a financial instrument, and which member-state rules apply.",
    templates: [
      { label: "EUR-Lex · MiFID II 2014/65/EU", url: "https://eur-lex.europa.eu/eli/dir/2014/65/oj" },
      { label: "EUR-Lex · MiCA 2023/1114", url: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj" },
    ],
  },
});

const REVIEW_SCORE_LABELS = [
  { key: "coverage", label: "Scope", title: "How much of the requested scope is covered by reviewed sources." },
  { key: "authorityFit", label: "Source fit", title: "How closely the cited source fits the claim being reviewed." },
  { key: "claimSupport", label: "Claim support", title: "How directly the source supports the next workstream." },
];

// Plain-language band for a 0–100 review score, so a non-expert can read it
// without decoding the number.
function scoreBand(value) {
  if (value >= 80) return "Strong";
  if (value >= 65) return "Fair";
  return "Limited";
}

// Bespoke single-jurisdiction Step 1 plans, one per reviewed source. Each stays
// scoped to its own jurisdiction so a US/SG/EU single review is as specific as
// the Hong Kong one (and matches the per-source brief in step 5).
const SINGLE_JURISDICTION_ACTION_PLANS = {
  "US-CLAIM-01": {
    startHere: {
      text: "Review whether the reviewed U.S. source — Rule 506(c) — fits the product as a private-placement route: general solicitation is allowed only if every purchaser is a verified accredited investor.",
      url: "https://www.ecfr.gov/current/title-17/section-230.506",
      label: "17 CFR §230.506",
    },
    materials: {
      need: [
        { text: "Accredited-investor verification design (income/net-worth evidence or third-party letters)" },
        { text: "Form D filing workflow", url: "https://www.sec.gov/resources-small-businesses/exempt-offerings/filing-form-d-notice", label: "SEC · file Form D" },
        { text: "Rule 506(d) bad-actor disqualification checks", url: "https://www.ecfr.gov/current/title-17/section-230.506", label: "17 CFR §230.506(d)" },
        { text: "Offering and subscription materials" },
      ],
      likelyHave: ["Product rights and token terms", "Entity and cap-table materials", "Intended investor profile"],
      counsel: [
        "Whether Rule 506(c) or another exemption fits the actual product and buyer set",
        "Non-U.S. buyer treatment, state blue-sky notices and secondary-transfer controls",
      ],
    },
  },
  "HK-CLAIM-01": {
    startHere: {
      text: "Review the Hong Kong tokenised-securities source as an applicability question: licensed intermediary, product controls, suitability and custody are the first workstream.",
      url: "https://apps.sfc.hk/edistributionWeb/gateway/EN/circular/doc?refNo=23EC52",
      label: "SFC · tokenised-securities circular (Nov 2023)",
    },
    materials: {
      need: [
        { text: "Product token rights and redemption mechanics" },
        { text: "Target client type and distribution channel" },
        { text: "Licensed-intermediary, suitability and onboarding workflow" },
        { text: "Custody, control and transfer-restriction design" },
      ],
      likelyHave: ["Product term sheet", "Issuer/operator structure", "Wallet and transfer-control design"],
      counsel: [
        "Whether the product is treated as a tokenised security in the actual facts",
        "Which Hong Kong regulated activities may be triggered",
        "Whether marketing, custody or secondary transfer needs additional controls",
      ],
    },
  },
  "SG-CLAIM-01": {
    startHere: {
      text: "Assess whether the token is a capital markets product under the SFA. MAS treats tokenised products the same as their non-tokenised equivalents, so the classification drives the offer path.",
      url: "https://www.mas.gov.sg/regulation/explainers/a-guide-to-digital-token-offerings",
      label: "MAS · A Guide to Digital Token Offerings",
    },
    materials: {
      need: [
        { text: "CMP classification analysis (is the token a security or CIS unit?)" },
        { text: "SFA Part 13 offer structure and section 243 prospectus assessment", url: "https://www.mas.gov.sg/-/media/mas/sectors/guidance/guide-on-the-tokenisation-of-capital-markets-products.pdf", label: "MAS · tokenisation guide" },
        { text: "Distribution safeguards for complex products" },
      ],
      likelyHave: ["Product term sheet", "Issuer/operator structure", "Target investor profile"],
      counsel: [
        "Whether the token is a capital markets product on the actual facts",
        "Which prospectus or exemption route applies under SFA Part 13",
      ],
    },
  },
  "EU-CLAIM-02": {
    startHere: {
      text: "Determine whether the product is a MiFID II financial instrument. If it is, MiCA does not apply and the MiFID II / local-law regime governs; MiCA alone does not resolve classification.",
      url: "https://eur-lex.europa.eu/eli/dir/2014/65/oj",
      label: "MiFID II 2014/65/EU",
    },
    materials: {
      need: [
        { text: "MiFID II financial-instrument classification inputs" },
        { text: "MiCA scope analysis", url: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj", label: "MiCA 2023/1114" },
        { text: "Member-state local-law review" },
      ],
      likelyHave: ["Product features and rights", "Issuer structure", "Target market and distribution"],
      counsel: [
        "Whether the product is a financial instrument under MiFID II",
        "Which member-state rules apply if MiCA is excluded",
      ],
    },
  },
};

function getScopedActionPlan(reviewScope) {
  if (reviewScope.scopeType !== "single-jurisdiction") return ACTION_PLAN;

  const item = RWA_EVIDENCE.find((entry) => entry.id === reviewScope.evidenceIds[0]);
  if (item && SINGLE_JURISDICTION_ACTION_PLANS[item.id]) {
    return SINGLE_JURISDICTION_ACTION_PLANS[item.id];
  }

  return {
    startHere: {
      text: `Review the selected ${item.title} source as a scoped local-counsel workstream. Do not infer cross-border coverage from this single signal.`,
      url: item.sourceUrl,
      label: item.sourceLabel,
    },
    materials: {
      need: [
        { text: "Product terms and token-holder rights" },
        { text: "Target users, distribution channel and custody model" },
        { text: "Local licensing and transfer-control analysis" },
      ],
      likelyHave: ["Product description", "Entity materials", "Intended user profile"],
      counsel: [
        `Whether the selected ${item.title} source supports the concrete product path`,
        "Which facts remain missing before any compliance conclusion",
      ],
    },
  };
}

export function App() {
  const [openMarkerId, setOpenMarkerId] = useState(null);
  const [caseRef, setCaseRef] = useState("RWA-DEMO-001");
  const [stage, setStage] = useState("landing"); // landing | app
  const [railOpen, setRailOpen] = useState(false);
  const [agentQuestion, setAgentQuestion] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | running | refused
  const [reviewScope, setReviewScope] = useState(() => createReviewScope());
  const [scopePanelOpen, setScopePanelOpen] = useState(false);
  const [handoffCopied, setHandoffCopied] = useState(false);
  const [briefCopied, setBriefCopied] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [step, setStep] = useState(1); // 1 brief · 2 agent review · 3 decision · 4 anchor · 5 handoff
  const [decision, setDecision] = useState("review");
  const [receipt, setReceipt] = useState(null);
  const [downstreamResult, setDownstreamResult] = useState(null);
  const [wallet, setWallet] = useState({ status: "disconnected", address: null, message: null });
  const [anchor, setAnchor] = useState({
    status: "idle",
    contractAddress: null,
    unverifiedContractAddress: null,
    preview: null,
    estimate: null,
    txHash: null,
    message: null,
  });
  const isDeploymentPreview = anchor.preview?.kind === "contract-deployment";
  const scopeLabel = reviewScope.label;
  const actionPlan = getScopedActionPlan(reviewScope);
  const reviewCouncil = buildReviewCouncil(reviewScope);
  const scopeIsSingle = reviewScope.scopeType === "single-jurisdiction";
  const councilSize = reviewCouncil.scorecards.length;
  const councilSizeWord = councilSize === 3 ? "three" : String(councilSize);
  const chamberAgents = reviewCouncil.scorecards.slice(0, 3).map((card, index) => ({
    ...card,
    chamberLabel: ["Scope", "Source", "Risk"][index],
    chamberClassName: ["source", "jurisdiction", "execution"][index],
  }));
  const scopedEvidence = RWA_EVIDENCE.filter((item) => reviewScope.evidenceIds.includes(item.id));
  const scopeSummaryEvidence = [...scopedEvidence].sort(
    (a, b) => SCOPE_SUMMARY_ORDER.indexOf(a.id) - SCOPE_SUMMARY_ORDER.indexOf(b.id),
  );
  const openItem = openMarkerId ? RWA_EVIDENCE.find((item) => item.id === openMarkerId) : null;

  async function connectTestWallet() {
    setWallet({ status: "connecting", address: null, message: null });

    try {
      const connection = await connectToInjectiveEvmTestnet(window.ethereum);
      setWallet({ status: "connected", address: connection.address, message: null });
    } catch (error) {
      setWallet({ status: "error", address: null, message: error.message });
    }
  }

  function runSearch() {
    if (searchStatus === "running") return;
    setSearchStatus("running");
    // Deterministic, offline routing — never depends on a network or an LLM.
    // Covered question opens the evidence map; anything outside the reviewed
    // pack is refused instead of fabricating a map.
    setTimeout(() => {
      const route = getReviewedQuestionRoute(agentQuestion);
      if (route) {
        setOpenMarkerId(route.jurisdictionId);
        setReviewScope(createReviewScope(route.jurisdictionId));
        setStage("app");
        setSearchStatus("idle");
      } else {
        setSearchStatus("refused");
      }
    }, 700);
  }

  function resetSearch() {
    setSearchStatus("idle");
  }

  // No-coverage branch: instead of a dead end, route to a scope the verified
  // database actually covers — the full cross-border map, or one jurisdiction.
  function openReviewedScope(jurisdictionId) {
    if (jurisdictionId) {
      setOpenMarkerId(jurisdictionId);
      setReviewScope(createReviewScope(jurisdictionId));
    } else {
      setOpenMarkerId(null);
      setReviewScope(createReviewScope());
    }
    setSearchStatus("idle");
    setStage("app");
  }

  // After human review, emit a machine-actionable handoff a downstream agent can
  // run against — the verified scope, the human decision, and the receipt proof.
  function buildScopeConstraints() {
    if (reviewScope.scopeType === "single-jurisdiction") {
      return scopedEvidence.map(
        (item) => `- **${item.title}** — ${item.summary}`,
      );
    }

    return [
      "- **United States** — candidate Rule 506(c) workstream; counsel confirms availability and scope.",
      "- **Hong Kong** — licensed-intermediary and product-control questions remain conditionally scoped.",
      "- **Singapore** — current source pack has no specific provision supporting a broader path.",
      "- **European Union** — classification remains unresolved in the current pack.",
    ];
  }

  function buildHandoffFacts() {
    if (!receipt) return null;
    const signals = scopedEvidence.reduce((acc, item) => {
      acc[item.id] = item.signal;
      return acc;
    }, {});
    return {
      caseRef: receipt.evidenceSet.decision.caseRef,
      reviewScope: scopeLabel,
      reviewMode: reviewScope.reviewMode,
      scopeType: reviewScope.scopeType,
      evidenceIds: reviewScope.evidenceIds,
      proposedAction: {
        label: PROPOSED_FINANCIAL_ACTION.label,
        network: PROPOSED_FINANCIAL_ACTION.network,
        executionState: PROPOSED_FINANCIAL_ACTION.execution,
        intent: PROPOSED_FINANCIAL_ACTION.intent,
      },
      signals,
      agentReviews: reviewCouncil.scorecards.map((card) => ({
        agentId: card.agentId,
        verdict: card.verdict,
        focus: card.focus,
        objections: card.objections,
      })),
      decision: "PROCEED",
      riskAcknowledged: true,
      reviewer: wallet.address || null,
      evidenceHash: receipt.evidenceHash,
      receiptHash: receipt.receiptHash,
      onchain:
        anchor.status === "anchored" && anchor.txHash
          ? {
              network: "injective-evm-testnet",
              chainId: INJECTIVE_EVM_TESTNET.chainId,
              txHash: anchor.txHash,
              contract: anchor.contractAddress,
            }
          : null,
    };
  }

  function buildAgentHandoff() {
    const facts = buildHandoffFacts();
    if (!facts) return "";
    return [
      "# LUO verified decision handoff",
      "",
      "## Verified facts",
      "```json",
      JSON.stringify(facts, null, 2),
      "```",
      "",
      "## Constraints for the downstream agent",
      "Act only within this human-verified scope. Do not exceed it or infer coverage outside the reviewed source anchors.",
      "",
      `- **Proposed action** — ${PROPOSED_FINANCIAL_ACTION.intent}`,
      "- **Execution boundary** — do not execute a transfer, order, strategy, or asset movement from this handoff alone.",
      ...buildScopeConstraints(),
    ].join("\n");
  }

  function buildCounselPrepBrief() {
    const lines = [
      "# Pre-counsel preparation brief",
      "",
      `**Case:** ${caseRef}`,
      `**Review scope:** ${scopeLabel} (${reviewScope.reviewMode})`,
      "",
      "A preparation worksheet built from a held Sentinel decision. It helps you arrive at counsel prepared. It is not legal advice and does not establish compliance.",
      "",
      "## Start here, before you contact counsel",
      actionPlan.startHere.text,
      `Primary source: ${actionPlan.startHere.label} — ${actionPlan.startHere.url}`,
      "",
      "## What to assemble",
      "### You need",
      ...actionPlan.materials.need.map((m) => `- [ ] ${m.text}`),
      "",
      "### You likely already have",
      ...actionPlan.materials.likelyHave.map((m) => `- [ ] ${m}`),
      "",
      "### Confirm with counsel",
      ...actionPlan.materials.counsel.map((m) => `- ${m}`),
      "",
      "## Source-by-source workstream",
    ];

    scopedEvidence.forEach((item) => {
      const tpl = COUNSEL_PREP_TEMPLATES[item.id];
      lines.push("", `### ${item.title} — ${item.signal}`);
      lines.push(`Source: ${item.sourceLabel} (${item.sourceUrl})`);
      if (item.secondarySourceUrl) {
        lines.push(`Also: ${item.secondarySourceLabel} (${item.secondarySourceUrl})`);
      }
      if (tpl) {
        lines.push(`Route to prepare: ${tpl.route}`);
        lines.push("Prepare before counsel:");
        tpl.steps.forEach((s) => lines.push(`- [ ] ${s}`));
        if (tpl.templates?.length) {
          lines.push("Templates & official sources:");
          tpl.templates.forEach((t) => lines.push(`- ${t.label}: ${t.url}`));
        }
        lines.push(`Confirm with counsel: ${tpl.confirm}`);
      } else {
        lines.push(item.summary);
      }
    });

    lines.push(
      "",
      "## Boundary",
      "This worksheet does not select a lead jurisdiction, establish compliance, or authorize issuing or transferring the asset. Those remain with counsel.",
    );
    return lines.join("\n");
  }

  function copyBrief() {
    navigator.clipboard?.writeText(buildCounselPrepBrief());
    setBriefCopied(true);
    setTimeout(() => setBriefCopied(false), 1600);
  }

  function downloadBrief() {
    const blob = new Blob([buildCounselPrepBrief()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt?.evidenceSet.decision.caseRef || "luo-case"}-counsel-prep.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function copyHandoff() {
    navigator.clipboard?.writeText(buildAgentHandoff());
    setHandoffCopied(true);
    setTimeout(() => setHandoffCopied(false), 1600);
  }

  function downloadHandoff() {
    const blob = new Blob([buildAgentHandoff()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${receipt?.evidenceSet.decision.caseRef || "luo-handoff"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function runDownstreamAgent() {
    setDownstreamResult(runBoundedDownstreamAgent({ handoffFacts: buildHandoffFacts() }));
  }

  async function prepareReceiptDraft() {
    if (wallet.status !== "connected") {
      setReceipt(null);
      setDecision("wallet-required");
      return;
    }

    setDecision("preparing");

    try {
      const nextReceipt = createProceedReceiptDraft({
        reviewerWallet: wallet.address,
        decidedAt: getSafeDecisionTimestamp(Math.floor(Date.now() / 1000)),
        nonce: hexlify(randomBytes(32)),
        caseRef,
        reviewScopeIds: reviewScope.evidenceIds,
        agentReviews: reviewCouncil.scorecards,
      });
      setReceipt(nextReceipt);
      setDownstreamResult(null);
      setDecision("draft");
      setAnchor((current) => ({
        ...current,
        status: current.contractAddress ? "ready-to-anchor" : "idle",
        preview: null,
        estimate: null,
        unverifiedContractAddress: null,
        txHash: null,
        message: null,
      }));
    } catch {
      setReceipt(null);
      setDecision("error");
    }
  }

  function selectEvidence(id) {
    setOpenMarkerId((current) => (current === id ? null : id));
  }

  function changeCaseRef(value) {
    setCaseRef(value);
    setReceipt(null);
    setDownstreamResult(null);
    setDecision("review");
    setAnchor((current) => ({
      ...current,
      status: current.contractAddress ? "ready-to-anchor" : "idle",
      preview: null,
      estimate: null,
      unverifiedContractAddress: null,
      txHash: null,
      message: null,
    }));
  }

  async function getBrowserProvider() {
    if (!window.ethereum) {
      throw new Error("Compatible browser wallet not found.");
    }
    const { BrowserProvider } = await import("ethers");
    return new BrowserProvider(window.ethereum);
  }

  async function getTestnetReceiptReader() {
    const { JsonRpcProvider } = await import("ethers");
    return new JsonRpcProvider(
      INJECTIVE_EVM_TESTNET.rpcUrl,
      INJECTIVE_EVM_TESTNET.chainId,
      { staticNetwork: true },
    );
  }

  async function getReceiptAnchorClient() {
    return import("./lib/receiptAnchorClient.js");
  }

  async function displayFee(estimate) {
    if (estimate.maxFeeWei === null) return null;
    const { formatEther } = await import("ethers");
    return formatEther(estimate.maxFeeWei);
  }

  function getErrorMessage(error) {
    return error?.shortMessage || error?.reason || error?.message || "The testnet action could not be completed.";
  }

  function getTransactionTargetLabel(preview) {
    if (preview.to === null) return "New receipt-anchor contract";
    return `${preview.to.slice(0, 12)}…${preview.to.slice(-8)}`;
  }

  async function reviewDeployment() {
    if (wallet.status !== "connected") {
      setAnchor((current) => ({ ...current, status: "error", message: "Connect a test wallet first." }));
      return;
    }

    setAnchor((current) => ({ ...current, status: "estimating", message: null }));
    try {
      const receiptAnchorClient = await getReceiptAnchorClient();
      const preview = receiptAnchorClient.createDeploymentTransactionPreview();
      const estimate = await receiptAnchorClient.estimateTestnetTransaction({
        provider: await getBrowserProvider(),
        walletAddress: wallet.address,
        preview,
      });
      const fee = await displayFee(estimate);
      setAnchor((current) => ({
        ...current,
        status: "deployment-reviewed",
        preview,
        estimate: { ...estimate, displayFee: fee },
        message: null,
      }));
    } catch (error) {
      setAnchor((current) => ({ ...current, status: "error", message: getErrorMessage(error) }));
    }
  }

  async function confirmDeployment() {
    if (!anchor.preview || !anchor.estimate) return;

    setAnchor((current) => ({ ...current, status: "submitting-deployment", message: null }));
    try {
      const receiptAnchorClient = await getReceiptAnchorClient();
      const provider = await getBrowserProvider();
      const transaction = await receiptAnchorClient.submitConfirmedTestnetTransaction({
        provider,
        walletAddress: wallet.address,
        preview: anchor.preview,
        gasLimit: anchor.estimate.gasLimit,
        operatorConfirmed: true,
      });
      const reader = await getTestnetReceiptReader();
      const contractAddress = await receiptAnchorClient.waitForDeployedContract({
        provider: reader,
        deployer: wallet.address,
        nonce: transaction.nonce,
        onAttempt: ({ attempt, attempts, contractAddress }) => {
          setAnchor((current) => ({
            ...current,
            message: `Waiting for deployment visibility (${attempt}/${attempts}) at ${contractAddress.slice(0, 10)}…${contractAddress.slice(-6)}.`,
          }));
        },
      });
      try {
        await receiptAnchorClient.verifyDeployedRuntimeBytecode({
          provider: reader,
          contractAddress,
        });
      } catch (error) {
        setAnchor({
          status: "error",
          contractAddress: null,
          unverifiedContractAddress: contractAddress,
          preview: null,
          estimate: null,
          txHash: transaction.hash,
          message: `Deployment is visible on-chain but its runtime was not verified. It will not be used: ${getErrorMessage(error)}`,
        });
        return;
      }
      setAnchor({
        status: "deployed",
        contractAddress,
        unverifiedContractAddress: null,
        preview: null,
        estimate: null,
        txHash: transaction.hash,
        message: "Contract is visible on-chain and verified. Review the receipt anchor next.",
      });
    } catch (error) {
      setAnchor((current) => ({ ...current, status: "error", message: getErrorMessage(error) }));
    }
  }

  // Recovery path for the known Injective-testnet case where a deployment is
  // visible on the explorer but the wallet/RPC reported it late or as failed.
  // The pasted address is only accepted after its runtime bytecode is verified.
  async function recoverDeployedContract(address) {
    const candidate = (address || "").trim();
    if (!candidate) return;

    setAnchor((current) => ({ ...current, status: "estimating", message: "Verifying the pasted contract address…" }));
    try {
      const receiptAnchorClient = await getReceiptAnchorClient();
      const reader = await getTestnetReceiptReader();
      const { contractAddress } = await receiptAnchorClient.verifyDeployedRuntimeBytecode({
        provider: reader,
        contractAddress: candidate,
      });
      setManualAddress("");
      setAnchor({
        status: "deployed",
        contractAddress,
        unverifiedContractAddress: null,
        preview: null,
        estimate: null,
        txHash: null,
        message: "Pasted contract verified on-chain. Review the receipt anchor next.",
      });
    } catch (error) {
      setAnchor((current) => ({ ...current, status: "error", message: getErrorMessage(error) }));
    }
  }

  async function reviewReceiptAnchor() {
    if (!receipt || !anchor.contractAddress || wallet.status !== "connected") return;

    setAnchor((current) => ({ ...current, status: "estimating", message: null }));
    try {
      const receiptAnchorClient = await getReceiptAnchorClient();
      const preview = receiptAnchorClient.createAnchorProceedTransactionPreview({
        contractAddress: anchor.contractAddress,
        receipt,
      });
      const estimate = await receiptAnchorClient.estimateTestnetTransaction({
        provider: await getBrowserProvider(),
        walletAddress: wallet.address,
        preview,
      });
      const fee = await displayFee(estimate);
      setAnchor((current) => ({
        ...current,
        status: "anchor-reviewed",
        preview,
        estimate: { ...estimate, displayFee: fee },
        message: null,
      }));
    } catch (error) {
      setAnchor((current) => ({ ...current, status: "error", message: getErrorMessage(error) }));
    }
  }

  async function confirmReceiptAnchor() {
    if (!anchor.preview || !anchor.estimate || !receipt) return;

    setAnchor((current) => ({ ...current, status: "submitting-anchor", message: null }));
    try {
      const receiptAnchorClient = await getReceiptAnchorClient();
      const provider = await getBrowserProvider();
      const transaction = await receiptAnchorClient.submitConfirmedTestnetTransaction({
        provider,
        walletAddress: wallet.address,
        preview: anchor.preview,
        gasLimit: anchor.estimate.gasLimit,
        operatorConfirmed: true,
      });
      const reader = await getTestnetReceiptReader();
      const record = await receiptAnchorClient.waitForAnchoredReceipt({
        provider: reader,
        contractAddress: anchor.contractAddress,
        receiptHash: receipt.receiptHash,
        expectedReceipt: receipt,
      });
      if (
        record.submitter.toLowerCase() !== wallet.address.toLowerCase()
        || record.evidenceHash !== receipt.evidenceHash
        || record.decidedAt !== receipt.decidedAt
        || record.productRefHash !== receipt.productRefHash
      ) {
        throw new Error("The confirmed record does not match the reviewed receipt.");
      }
      setAnchor((current) => ({
        ...current,
        status: "anchored",
        preview: null,
        estimate: null,
        txHash: transaction.hash,
        message: "Proceed receipt is confirmed on testnet.",
      }));
    } catch (error) {
      setAnchor((current) => ({ ...current, status: "error", message: getErrorMessage(error) }));
    }
  }

  if (stage === "landing") {
    return (
      <div className="landing">
        <img className="landing-map" src="/atlas-map.png" alt="" aria-hidden="true" />
        <div className="landing-glow" aria-hidden="true" />
        <span className="landing-status"><span /> Testnet demo</span>
        <div className="landing-inner">
          <img className="landing-logo" src="/luo-mark.png" alt="LUO" />
          <p className="landing-tagline">Evidence-bound AI handoffs</p>
          <form
            className="landing-search"
            onSubmit={(event) => {
              event.preventDefault();
              runSearch();
            }}
          >
            <span className="landing-search-icon" aria-hidden="true">⌕</span>
            <input
              value={agentQuestion}
              onChange={(event) => {
                setAgentQuestion(event.target.value);
                if (searchStatus === "refused") resetSearch();
              }}
              placeholder="Ask a reviewed RWA question…"
              aria-label="Ask a reviewed RWA question"
              autoFocus
            />
            <button type="submit" disabled={searchStatus === "running"}>
              {searchStatus === "running" ? (
                "Routing…"
              ) : (
                <>
                  <span className="search-label-full">LUO Search</span>
                  <span className="search-label-short">Search</span>
                </>
              )}
            </button>
          </form>
          {searchStatus === "refused" && (
            <div className="landing-suggest">
              <p className="landing-suggest-title">No reviewed match for this question.</p>
              <p className="landing-suggest-body">
                LUO will not fabricate a map. Choose a path it can ground in verified sources:
              </p>
              <button
                type="button"
                className="suggest-chip suggest-chip--primary"
                onClick={() => openReviewedScope(null)}
              >
                Cross-border · US · HK · SG · EU
              </button>
              <p className="landing-suggest-label">Or a single jurisdiction</p>
              <div className="suggest-chips">
                {RWA_EVIDENCE.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="suggest-chip"
                    onClick={() => openReviewedScope(item.id)}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="landing-note">Grounded, not guessed · every signal traceable to source</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="identity">
          <img src="/luo-logo.png" alt="LUO" className="logo" />
          <span className="topbar-divider" />
          <div>
            <strong>LUO Sentinel</strong>
            <span>Evidence-bound decision record for tokenized RWA actions · testnet demo</span>
          </div>
        </div>
        <button
          className={`testnet-status testnet-status--${wallet.status}`}
          onClick={connectTestWallet}
          disabled={wallet.status === "connecting"}
          title={wallet.message || "Connect a test-only browser wallet"}
        >
          <span />
          {wallet.status === "connected"
            ? `Testnet · ${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
            : wallet.status === "connecting"
              ? "Connecting test wallet…"
              : wallet.status === "error"
                ? "Wallet unavailable · retry"
              : "Testnet · connect wallet"}
        </button>
      </header>

      <main className="atlas-layout">
        <section className="atlas-stage" aria-label="Cross-border evidence map">
          <div className="atlas-intro">
            <p>Evidence map</p>
            <h1>{reviewScope.scopeType === "single-jurisdiction" ? "Single-source" : "Cross-border"}<br />review</h1>
            <span className="scope-line">Agent-routed across {scopeLabel.includes("single") ? "one human-verified source" : "four human-verified sources"}</span>
            <div className="map-provenance" aria-label="Evidence map provenance">
              <strong>{RWA_EVIDENCE_PROVENANCE.packLabel}</strong>
              <small>
                Last reviewed {RWA_EVIDENCE_PROVENANCE.reviewedAt} · {RWA_EVIDENCE_PROVENANCE.sourceType}. Refresh required when primary sources change.
              </small>
            </div>
          </div>

          <img className="atlas-map" src="/atlas-map.png" alt="Abstract world map with cross-border connection lines" />

          <div className="markers" aria-label="Jurisdiction signals">
            {RWA_EVIDENCE.map((item) => (
              <button
                key={item.id}
                className={`${item.className} ${openMarkerId === item.id ? "is-selected" : ""} ${reviewScope.evidenceIds.includes(item.id) ? "" : "is-out-of-scope"}`}
                onClick={() => selectEvidence(item.id)}
                aria-pressed={openMarkerId === item.id}
              >
                <span className={`marker-dot marker-dot--${item.tone}`} />
                <span className="marker-copy">
                  <strong>{item.title}</strong>
                  <em>{item.signal}</em>
                  <small>{item.id}</small>
                </span>
              </button>
            ))}
          </div>

          <div className="map-note">
            <span>Evidence snapshot</span>
            Map signals come from reviewed source anchors, not a live legal conclusion. {RWA_EVIDENCE_PROVENANCE.refreshPolicy}
          </div>

          {openItem && (
            <div className="marker-zoom" onClick={() => setOpenMarkerId(null)}>
              <div className="marker-zoom-card" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="marker-popover-close"
                  onClick={() => setOpenMarkerId(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
                <span className={`signal signal--${openItem.tone}`}>{openItem.signal}</span>
                <h3>{openItem.title}</h3>
                <p className="evidence-summary">{openItem.summary}</p>
                <div className="evidence-source">
                  <small>Source anchor · {openItem.id}</small>
                  <a href={openItem.sourceUrl} target="_blank" rel="noreferrer">
                    {openItem.sourceLabel} ↗
                  </a>
                  {openItem.secondarySourceUrl && (
                    <a href={openItem.secondarySourceUrl} target="_blank" rel="noreferrer">
                      {openItem.secondarySourceLabel} ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <button
          type="button"
          className="rail-tab"
          onClick={() => {
            setStep(1);
            setRailOpen(true);
          }}
          aria-expanded={railOpen}
        >
          Next step →
        </button>
        <div className={`rail-overlay ${railOpen ? "is-open" : ""}`} onClick={() => setRailOpen(false)}>
          <aside
            className="decision-rail decision-sheet"
            aria-label="Human decision"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="rail-close" onClick={() => setRailOpen(false)} aria-label="Close">✕</button>
            <div className="sheet-inner">
              <nav className="sheet-stepper" aria-label="Workflow steps">
                {[["1", "Action"], ["2", "Review"], ["3", "Decision"], ["4", "Receipt"], ["5", "Handoff"]].map(([n, label]) => (
                  <button
                    key={n}
                    type="button"
                    className={`sheet-step ${step === Number(n) ? "is-active" : ""} ${step > Number(n) ? "is-done" : ""}`}
                    onClick={() => setStep(Number(n))}
                  >
                    <span className="sheet-step-num">{n}</span>
                    {label}
                  </button>
                ))}
              </nav>

              {step === 1 && (
                <div className="sheet-step-panel">
                  <p className="sheet-kicker">Step 1 · The held action</p>
                  <h2>What Sentinel held</h2>
                  <section className="preflight-action-card" aria-label="Proposed Injective financial action">
                    <div>
                      <span>{PROPOSED_FINANCIAL_ACTION.network}</span>
                      <h3>{PROPOSED_FINANCIAL_ACTION.label}</h3>
                      <p>{PROPOSED_FINANCIAL_ACTION.intent}</p>
                    </div>
                    <strong>{PROPOSED_FINANCIAL_ACTION.execution}</strong>
                    <dl>
                      {PROPOSED_FINANCIAL_ACTION.constraints.map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                  <div className="action-start">
                    <h3>Agent starts here</h3>
                    <p>
                      {actionPlan.startHere.text}{" "}
                      <a className="template-link" href={actionPlan.startHere.url} target="_blank" rel="noreferrer">
                        {actionPlan.startHere.label} ↗
                      </a>
                    </p>
                  </div>
                  <div className="reco-materials">
                    <div>
                      <h4>Take to local counsel</h4>
                      <ul>{actionPlan.materials.counsel.map((m) => <li key={m}>{m}</li>)}</ul>
                    </div>
                  </div>
                  <p className="sheet-hint">
                    The full assembly checklist and per-source workstreams are generated as a downloadable brief in step 5, scoped to your decision.
                  </p>
                  <div className="sheet-nav">
                    <button className="decision-button" onClick={() => setStep(2)}>Run the review →</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="sheet-step-panel">
                  <p className="sheet-kicker">Step 2 · Agent Review Council</p>
                  <h2>Three checks before anything runs</h2>
                  <span className="rail-lede">
                    {reviewScope.scopeType === "single-jurisdiction"
                      ? `Three reviewers look at ${scopeLabel} from different angles, then hand the decision to you.`
                      : "Three reviewers look at the map from different angles, then hand the decision to you."}
                  </span>
                  <p className="score-guide">
                    Each score is out of 100 — higher means the reviewed sources cover more of that question. It's a review score, not a prediction or a legal opinion.
                  </p>
                  <div className="preflight-flow" aria-label="Agent preflight sequence">
                    <span>Action detected</span>
                    <span>Evidence routed</span>
                    <span>Human gate required</span>
                  </div>
                  <div className="review-council review-council--preflight" aria-label="Agent review council scorecards">
                    {reviewCouncil.scorecards.map((card) => (
                      <article className="review-card" key={card.agentId}>
                        <div className="review-card-head">
                          <div>
                            <h3>{card.name}</h3>
                            <span>{card.role}</span>
                          </div>
                          <strong title={card.scoringBasis}>{card.plainStatus}</strong>
                        </div>
                        <p className="review-question">{card.question}</p>
                        <div className="review-scores">
                          {REVIEW_SCORE_LABELS.map((score) => (
                            <span key={score.key} title={score.title}>
                              {score.label} · {scoreBand(card.scores[score.key])} {card.scores[score.key]}/100
                            </span>
                          ))}
                        </div>
                        <ul>
                          {card.findings.map((finding) => <li key={finding}>{finding}</li>)}
                        </ul>
                      </article>
                    ))}
                  </div>
                  <p className="reco-disclaimer">All three point to the same thing: a person has to decide before anything runs.</p>
                  <div className="sheet-nav">
                    <button className="decision-button" onClick={() => setStep(3)}>Make the decision →</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="sheet-step-panel sheet-step-panel--gate">
                  <p className="sheet-kicker">Step 3 · The Sentinel gate</p>
                  <h2>You decide what happens</h2>
                  <p className="rail-lede">Sentinel holds the action until you decide. Neither choice moves the asset.</p>

                  <div className="scope-reference-bar">
                    <div>
                      <span>Reviewing scope</span>
                      <strong>{reviewScope.scopeType === "single-jurisdiction" ? scopedEvidence[0]?.title : "Cross-border review"} · {scopedEvidence.length} signal{scopedEvidence.length === 1 ? "" : "s"}</strong>
                    </div>
                    <button type="button" onClick={() => setScopePanelOpen(true)}>View references</button>
                  </div>

                  {scopePanelOpen && (
                    <div className="scope-reference-backdrop" onClick={() => setScopePanelOpen(false)}>
                      <aside className="scope-summary-panel scope-summary-panel--popover" aria-label="Reviewing scope summary" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="scope-reference-close" onClick={() => setScopePanelOpen(false)} aria-label="Close scope references">✕</button>
                      <p>Reviewing scope</p>
                      <h3>{reviewScope.scopeType === "single-jurisdiction" ? scopedEvidence[0]?.title : "Cross-border"}<br />review</h3>
                      <strong>{scopedEvidence.length} reviewed signal{scopedEvidence.length === 1 ? "" : "s"}</strong>
                      <div className="scope-signal-list">
                        {scopeSummaryEvidence.map((item) => (
                          <div className={`scope-signal-row scope-signal-row--${item.tone}`} key={item.id}>
                            <span aria-hidden="true" />
                            <div>
                              <b>{item.title}</b>
                              <small>{item.id}</small>
                            </div>
                            <em>{item.signal}</em>
                          </div>
                        ))}
                      </div>
                      <div className="scope-pack-note">
                        <span>{RWA_EVIDENCE_PROVENANCE.packLabel}</span>
                        <small>Last reviewed {RWA_EVIDENCE_PROVENANCE.reviewedAt}. Refresh required before reuse.</small>
                      </div>
                      </aside>
                    </div>
                  )}

                  <div className="gate-workspace">
                    <div className="gate-main">
                      <div className="gate-verdict-recap">
                        <div>
                          <span>Council verdict</span>
                          <strong>All {councilSizeWord} agents flagged. Your call.</strong>
                        </div>
                        <button type="button" onClick={() => setStep(2)}>Review again</button>
                      </div>

                      {scopeIsSingle && (
                        <p className="gate-scope-note">Single-source review · this is one jurisdiction's anchor, not a jurisdiction-wide legal assessment.</p>
                      )}

                      <div className="gate-held-line">
                        <span>Held action</span>
                        <strong>{receipt ? "Receipt ready" : decision === "hold" ? "Held for counsel" : "OUSG-like treasury sample"}</strong>
                        <small>0 INJ · Injective testnet</small>
                      </div>

                      <div className="gate-outcomes">
                        <article className="gate-outcome">
                          <div className="gate-outcome-head">
                            <span className="gate-outcome-key">A</span>
                            <strong>Hold for counsel</strong>
                            <em>Stays frozen</em>
                          </div>
                          <p>The action stays frozen. The agents' flags are packaged for counsel review, and you can decide again later.</p>
                        </article>
                        <article className="gate-outcome gate-outcome--go">
                          <div className="gate-outcome-head">
                            <span className="gate-outcome-key gate-outcome-key--go">B</span>
                            <strong>Proceed with sign-off</strong>
                            <em>Decision recorded</em>
                          </div>
                          <p>You sign with your wallet that you reviewed the flags and chose to move forward. This anchors an accountable decision on-chain. It does <strong>not</strong> authorize issuing or transferring the asset; that still requires counsel.</p>
                        </article>
                      </div>

                      <label className="scenario-ref-field">
                        <span>Action reference</span>
                        <input
                          value={caseRef}
                          onChange={(event) => changeCaseRef(event.target.value)}
                          maxLength={64}
                          pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,63}"
                          title="Use 3–64 letters, numbers, dots, hyphens, or underscores; start with a letter or number."
                        />
                      </label>

                      {wallet.status !== "connected" ? (
                        <div className="connect-cta">
                          <button className="decision-button" onClick={connectTestWallet} disabled={wallet.status === "connecting"}>
                            {wallet.status === "connecting" ? "Connecting reviewer wallet…" : "① Connect reviewer wallet"}
                          </button>
                        </div>
                      ) : (
                        <p className="reviewer-id">✓ Reviewer · {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}</p>
                      )}

                      <div className="rail-actions">
                        <button className="decision-button decision-button--quiet" onClick={() => setDecision("hold")}>Hold for counsel</button>
                        <button className="decision-button" onClick={prepareReceiptDraft} disabled={decision === "preparing" || wallet.status !== "connected"}>
                          {decision === "preparing"
                            ? "Signing & preparing receipt…"
                            : wallet.status !== "connected"
                              ? "Connect wallet to sign off"
                              : "Sign and prepare receipt"}
                        </button>
                      </div>

                      <div className={`decision-state decision-state--${decision}`}>
                        {decision === "review" && "Held · nothing is executed until you decide."}
                        {decision === "hold" && "Held for counsel. No Injective action is executed."}
                        {decision === "preparing" && "Creating your signed receipt."}
                        {decision === "draft" && "Proceed receipt ready. Decision recorded."}
                        {decision === "wallet-required" && "Connect the reviewer wallet first."}
                        {decision === "error" && "Receipt could not be prepared. No wallet action occurred."}
                      </div>

                      {receipt && (
                        <>
                          <div className="receipt-commitment">
                            <span>Proceed receipt · local only</span>
                            <code>{receipt.receiptHash.slice(0, 18)}…{receipt.receiptHash.slice(-8)}</code>
                            <small>{receipt.evidenceSet.decision.caseRef} · {receipt.evidenceSet.decision.reviewScope.length} reviewed signal{receipt.evidenceSet.decision.reviewScope.length === 1 ? "" : "s"} · agent-reviewed</small>
                          </div>
                          <div className="sheet-nav">
                            <button className="decision-button" onClick={() => setStep(4)}>Continue to anchoring →</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="sheet-step-panel">
                  <p className="sheet-kicker">Step 4 · On-chain receipt</p>
                  <h2>Seal the decision on-chain</h2>
                  {!receipt && <p className="sheet-hint">Complete the decision in step 3 first.</p>}
                  {receipt && (
                    <>
                      {wallet.status !== "connected" && (
                        <button className="testnet-review-button" onClick={connectTestWallet}>Connect wallet</button>
                      )}
                      {wallet.status === "connected" && !anchor.contractAddress && !anchor.preview && (
                        <button className="testnet-review-button" onClick={reviewDeployment} disabled={anchor.status === "estimating"}>
                          {anchor.status === "estimating" ? "Estimating deployment fee…" : "① Review contract deployment"}
                        </button>
                      )}
                      {wallet.status === "connected" && !anchor.contractAddress && (
                        <p className="sheet-hint">
                          On Injective EVM testnet some wallets show a successful deployment as “failed.” This app confirms the contract from its on-chain code, so trust the explorer and this check over the wallet status.
                        </p>
                      )}
                      {anchor.contractAddress && (
                        <div className="testnet-result">
                          <span>Contract verified ✓</span>
                          <code>{anchor.contractAddress.slice(0, 12)}…{anchor.contractAddress.slice(-8)}</code>
                        </div>
                      )}
                      {anchor.contractAddress && !anchor.preview && anchor.status !== "anchored" && (
                        <button className="testnet-review-button" onClick={reviewReceiptAnchor} disabled={anchor.status === "estimating"}>
                          {anchor.status === "estimating" ? "Estimating testnet fee…" : "Review receipt anchor"}
                        </button>
                      )}
                      {anchor.preview && anchor.estimate && anchor.status !== "anchored" && (
                        <section className="transaction-preview" aria-label="Testnet transaction preview">
                          <span>{isDeploymentPreview ? "Contract deployment preview" : "Receipt anchor preview"}</span>
                          <dl>
                            <div><dt>Action</dt><dd>{anchor.preview.label}</dd></div>
                            <div><dt>Target</dt><dd>{getTransactionTargetLabel(anchor.preview)}</dd></div>
                            <div><dt>Transfer</dt><dd>0 INJ</dd></div>
                            <div><dt>Maximum fee</dt><dd>{anchor.estimate.displayFee === null ? "Unavailable" : `${anchor.estimate.displayFee} INJ`}</dd></div>
                          </dl>
                          <button
                            className="decision-button"
                            onClick={isDeploymentPreview ? confirmDeployment : confirmReceiptAnchor}
                            disabled={anchor.status === "submitting-deployment" || anchor.status === "submitting-anchor"}
                          >
                            {isDeploymentPreview
                              ? anchor.status === "submitting-deployment" ? "Waiting for deployment confirmation…" : "② Confirm deployment in wallet"
                              : anchor.status === "submitting-anchor" ? "Waiting for receipt confirmation…" : "③ Confirm receipt anchor in wallet"}
                          </button>
                        </section>
                      )}
                      {anchor.message && <p className={`testnet-message testnet-message--${anchor.status}`}>{anchor.message}</p>}
                      {!anchor.contractAddress && anchor.status === "error" && (
                        <div className="manual-recovery">
                          <label>
                            <span>Already deployed? Paste the contract address from the explorer to continue.</span>
                            <input
                              value={manualAddress || anchor.unverifiedContractAddress || ""}
                              onChange={(event) => setManualAddress(event.target.value)}
                              placeholder="0x…"
                              spellCheck={false}
                              autoComplete="off"
                            />
                          </label>
                          <button
                            type="button"
                            className="testnet-review-button"
                            onClick={() => recoverDeployedContract(manualAddress || anchor.unverifiedContractAddress)}
                          >
                            Verify pasted contract
                          </button>
                        </div>
                      )}
                      {anchor.status === "anchored" && (
                        <div className="sheet-nav">
                          <button className="decision-button" onClick={() => setStep(5)}>Continue to handoff →</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="sheet-step-panel">
                  <p className="sheet-kicker">Step 5 · Verified handoff</p>
                  <h2>Hand off, inside the scope</h2>
                  {!receipt && <p className="sheet-hint">Complete the earlier steps first.</p>}
                  {receipt && (
                    <>
                      <div className="receipt-commitment">
                        <span>{anchor.status === "anchored" ? "Receipt hash · anchored on-chain" : "Receipt hash · local"}</span>
                        <code>{receipt.receiptHash.slice(0, 18)}…{receipt.receiptHash.slice(-8)}</code>
                      </div>
                      {anchor.txHash && (
                        <a className="explorer-link" href={`${INJECTIVE_EVM_TESTNET.blockExplorerUrl}tx/${anchor.txHash}`} target="_blank" rel="noreferrer">
                          View testnet transaction ↗
                        </a>
                      )}
                      <div className="handoff-templates">
                        <p className="handoff-templates-intro">Two ready-to-use templates so you can move before counsel is engaged.</p>

                        <section className="handoff-card handoff-card--human" aria-label="Pre-counsel preparation brief">
                          <div className="handoff-card-head">
                            <span className="handoff-card-for">For you · before counsel</span>
                            <h3>Pre-counsel preparation brief</h3>
                          </div>
                          <p className="handoff-card-lede">A procedural worksheet: what to assemble, what you likely have, and exactly what to confirm with counsel for {scopeLabel}.</p>
                          <pre>{buildCounselPrepBrief()}</pre>
                          <div className="handoff-actions">
                            <button type="button" className="testnet-review-button" onClick={copyBrief}>
                              {briefCopied ? "Copied ✓" : "Copy brief"}
                            </button>
                            <button type="button" className="testnet-review-button" onClick={downloadBrief}>Download .md</button>
                          </div>
                        </section>

                        <section className="handoff-card handoff-card--agent" aria-label="Downstream agent handoff">
                          <div className="handoff-card-head">
                            <span className="handoff-card-for">For a downstream agent</span>
                            <h3>Scope-bound machine handoff</h3>
                          </div>
                          <p className="handoff-card-lede">Structured, verified facts plus hard limits, so an automated agent can prepare work without exceeding the reviewed scope.</p>
                          <pre>{buildAgentHandoff()}</pre>
                          <div className="handoff-actions">
                            <button type="button" className="testnet-review-button" onClick={copyHandoff}>
                              {handoffCopied ? "Copied ✓" : "Copy handoff"}
                            </button>
                            <button type="button" className="testnet-review-button" onClick={downloadHandoff}>Download .md</button>
                            <button type="button" className="testnet-review-button" onClick={runDownstreamAgent}>Run counsel-prep agent</button>
                          </div>
                          <p className="reco-disclaimer">Only the receipt hash is anchored on-chain. This is not an issuance or a compliance determination.</p>
                        </section>
                      </div>
                      {downstreamResult && (
                        <section className="downstream-agent" aria-label="Bounded downstream agent output">
                          <span>{downstreamResult.mode}</span>
                          <h3>{downstreamResult.title}</h3>
                          <p>{downstreamResult.summary}</p>
                          <div className="downstream-grid">
                            <div>
                              <h4>Counsel preparation checklist</h4>
                              <ol>
                                {downstreamResult.checklist.map((item) => <li key={item}>{item}</li>)}
                              </ol>
                            </div>
                            <div>
                              <h4>Execution constraints</h4>
                              <ul>
                                {downstreamResult.constraints.map((item) => <li key={item}>{item}</li>)}
                              </ul>
                            </div>
                          </div>
                        </section>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <footer className="footer">
        <span>Evidence-first · Jurisdiction-aware · Human-in-the-loop</span>
        <span>Testnet decision record · not legal advice · does not establish compliance or authorize an asset transaction.</span>
      </footer>
    </div>
  );
}
