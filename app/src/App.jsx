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
    text: "Assess whether a Rule 506(c) private-placement route could fit the reviewed U.S. source. This is a scoped research starting point, not an eligibility or offering finding.",
    url: "https://www.ecfr.gov/current/title-17/section-230.506",
    label: "17 CFR §230.506",
  },
  materials: {
    need: [
      { text: "Accredited-investor verification design" },
      { text: "Form D filing workflow (if counsel confirms an exempt path)" },
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

const REVIEW_SCORE_LABELS = [
  { key: "coverage", label: "Scope", title: "How much of the requested scope is covered by reviewed sources." },
  { key: "authorityFit", label: "Source fit", title: "How closely the cited source fits the claim being reviewed." },
  { key: "claimSupport", label: "Claim support", title: "How directly the source supports the next workstream." },
];

function getScopedActionPlan(reviewScope) {
  if (reviewScope.scopeType !== "single-jurisdiction") return ACTION_PLAN;

  const item = RWA_EVIDENCE.find((entry) => entry.id === reviewScope.evidenceIds[0]);
  if (item?.id === "HK-CLAIM-01") {
    return {
      startHere: {
        text: "Review the Hong Kong tokenised-securities source as an applicability question: licensed intermediary, product controls, suitability and custody are the first workstream.",
        url: item.sourceUrl,
        label: item.sourceLabel,
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
    };
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
  const [handoffCopied, setHandoffCopied] = useState(false);
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
  const scopedEvidence = RWA_EVIDENCE.filter((item) => reviewScope.evidenceIds.includes(item.id));
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
      ...buildScopeConstraints(),
    ].join("\n");
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
        <div className="landing-inner">
          <img className="landing-logo" src="/luo-logo.png" alt="LUO" />
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
          </form>
          {searchStatus !== "refused" && (
            <div className="landing-actions">
              <button type="button" onClick={runSearch} disabled={searchStatus === "running"}>
                {searchStatus === "running" ? "Routing to verified sources…" : "LUO Search"}
              </button>
            </div>
          )}
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
        <p className="landing-note">Grounded, not guessed — every signal traceable to source.</p>
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
                {[["1", "Action plan"], ["2", "Agent review"], ["3", "Decision"], ["4", "Anchor"], ["5", "Handoff"]].map(([n, label]) => (
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
                  <p className="sheet-kicker">Step 1 · Source-bounded action plan</p>
                  <h2>What to do next</h2>
                  <div className="action-start">
                    <h3>Start here</h3>
                    <p>
                      {actionPlan.startHere.text}{" "}
                      <a className="template-link" href={actionPlan.startHere.url} target="_blank" rel="noreferrer">
                        {actionPlan.startHere.label} ↗
                      </a>
                    </p>
                  </div>
                  <div className="reco-materials">
                    <div>
                      <h4>Need</h4>
                      <ul>
                        {actionPlan.materials.need.map((m) => (
                          <li key={m.text}>
                            {m.text}
                            {m.url && (
                              <a className="template-link" href={m.url} target="_blank" rel="noreferrer"> · {m.label} ↗</a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>Likely have</h4>
                      <ul>{actionPlan.materials.likelyHave.map((m) => <li key={m}>{m}</li>)}</ul>
                    </div>
                    <div>
                      <h4>Take to local counsel</h4>
                      <ul>{actionPlan.materials.counsel.map((m) => <li key={m}>{m}</li>)}</ul>
                    </div>
                  </div>
                  <p className="reco-disclaimer">This narrows the next work; it does not determine where an asset may be offered or transferred. Take this brief and the linked sources to qualified local counsel.</p>
                  <div className="sheet-nav">
                    <button className="decision-button" onClick={() => setStep(2)}>Continue to agent review →</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="sheet-step-panel">
                  <p className="sheet-kicker">Step 2 · Agent Review Council</p>
                  <h2>Three agents review the same evidence</h2>
                  <span className="rail-lede">
                    {reviewScope.scopeType === "single-jurisdiction"
                      ? `Reviewing ${scopeLabel}: the council checks source correctness, authority coverage and applicability risk.`
                      : "Reviewing the comparative map: the council checks jurisdiction coverage, source support and residual risk."}
                  </span>
                  <p className="score-guide">
                    Scores are audit weights, not AI confidence. Each agent starts from 100 and deducts for missing scope, source limits, weak claim support, and unresolved counsel questions.
                  </p>
                  <div className="review-council" aria-label="Agent review council scorecards">
                    {reviewCouncil.scorecards.map((card) => (
                      <article className="review-card" key={card.agentId}>
                        <div className="review-card-head">
                          <div>
                            <h3>{card.name}</h3>
                            <span>{card.role}</span>
                          </div>
                          <strong>{card.verdict}</strong>
                        </div>
                        <p>{card.focus}</p>
                        <div className="review-scores">
                          {REVIEW_SCORE_LABELS.map((score) => (
                            <span key={score.key} title={score.title}>
                              {score.label} {card.scores[score.key]}/100
                            </span>
                          ))}
                        </div>
                        <small className="score-basis">Why: {card.scoringBasis}</small>
                        <ul>
                          {card.findings.map((finding) => <li key={finding}>{finding}</li>)}
                        </ul>
                      </article>
                    ))}
                  </div>
                  <p className="reco-disclaimer">
                    Gate: {reviewCouncil.aggregate.gate.replaceAll("-", " ")}. Audit weights only; human review stays required.
                  </p>
                  <div className="sheet-nav">
                    <button className="decision-button" onClick={() => setStep(3)}>Continue to decision →</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="sheet-step-panel">
                  <p className="sheet-kicker">Step 3 · Human decision</p>
                  <h2>Record the next step</h2>
                  <span className="rail-lede">Reviewing {scopeLabel}. A human decides what happens next.</span>

                  <label className="scenario-ref-field">
                    <span>Scenario reference</span>
                    <input
                      value={caseRef}
                      onChange={(event) => changeCaseRef(event.target.value)}
                      maxLength={64}
                      pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,63}"
                      title="Use 3–64 letters, numbers, dots, hyphens, or underscores; start with a letter or number."
                      aria-describedby="scenario-reference-help"
                    />
                    <small id="scenario-reference-help">{reviewScope.evidenceIds.length} reviewed signal{reviewScope.evidenceIds.length === 1 ? "" : "s"} · uppercase on receipt · non-sensitive only</small>
                  </label>

                  {wallet.status !== "connected" ? (
                    <div className="connect-cta">
                      <button className="decision-button" onClick={connectTestWallet} disabled={wallet.status === "connecting"}>
                        {wallet.status === "connecting" ? "Connecting reviewer wallet…" : "① Connect reviewer wallet"}
                      </button>
                      <p className="sheet-hint">Connect your wallet first — the decision is recorded as this reviewer.</p>
                    </div>
                  ) : (
                    <p className="reviewer-id">✓ Reviewer · {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}</p>
                  )}

                  <div className="rail-actions">
                    <button className="decision-button decision-button--quiet" onClick={() => setDecision("hold")}>Hold for counsel</button>
                    <button className="decision-button" onClick={prepareReceiptDraft} disabled={decision === "preparing" || wallet.status !== "connected"}>
                      {decision === "preparing"
                        ? "Preparing commitment…"
                        : wallet.status !== "connected"
                          ? "② Proceed (connect wallet first)"
                          : "Proceed — prepare decision receipt"}
                    </button>
                  </div>

                  <div className={`decision-state decision-state--${decision}`}>
                    {decision === "review" && "No legal conclusion, compliance determination, or asset authorization is produced."}
                    {decision === "hold" && "Held. No receipt created."}
                    {decision === "preparing" && "Creating a local public commitment."}
                    {decision === "draft" && "Proceed receipt ready. No transaction has been submitted."}
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
              )}

              {step === 4 && (
                <div className="sheet-step-panel">
                  <p className="sheet-kicker">Step 4 · Anchor on testnet</p>
                  <h2>Anchor the receipt</h2>
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
                  <p className="sheet-kicker">Step 5 · On-chain proof &amp; agent handoff</p>
                  <h2>Verifiable &amp; ready to hand off</h2>
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
                      <section className="agent-handoff" aria-label="Agent handoff brief">
                        <span>Agent handoff · machine-actionable (off-chain)</span>
                        <pre>{buildAgentHandoff()}</pre>
                        <div className="handoff-actions">
                          <button type="button" className="testnet-review-button" onClick={copyHandoff}>
                            {handoffCopied ? "Copied ✓" : "Copy handoff"}
                          </button>
                          <button type="button" className="testnet-review-button" onClick={downloadHandoff}>Download .md</button>
                          <button type="button" className="testnet-review-button" onClick={runDownstreamAgent}>Run bounded downstream agent</button>
                        </div>
                        <p className="reco-disclaimer">This brief stays off-chain. Only the receipt hash is anchored on-chain.</p>
                      </section>
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
