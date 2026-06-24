import { useState } from "react";
import { hexlify, randomBytes } from "ethers";
import { connectToInjectiveEvmTestnet, INJECTIVE_EVM_TESTNET } from "./lib/injectiveEvm.js";
import { createProceedReceiptDraft, getSafeDecisionTimestamp } from "./lib/onchainReceipt.js";
import { RWA_EVIDENCE } from "./lib/rwaEvidence.js";

// The reviewed evidence pack the local agent is allowed to route to. The agent
// never answers freely: it either maps a question onto these human-verified
// source signals, or it refuses instead of fabricating a map.
const SUPPORTED_SCENARIO_QUESTION =
  "We're launching a tokenized US Treasury (OUSG) product, where can we legally offer and transfer it?";

function evaluateAgentCoverage(question) {
  const q = (question || "").trim().toLowerCase();
  if (q.length === 0) return false;
  const mentionsReviewedAsset = /(ousg|tokeniz(?:ed)? treasury|treasury product|\brwa\b)/.test(q);
  const mentionsCrossBorder = /(jurisdiction|cross[ -]?border|offer|transfer|market|where|sell|distribut|abroad|four)/.test(q);
  return mentionsReviewedAsset && mentionsCrossBorder;
}

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

export function App() {
  const [openMarkerId, setOpenMarkerId] = useState(null);
  const [caseRef, setCaseRef] = useState("RWA-DEMO-001");
  const [stage, setStage] = useState("landing"); // landing | app
  const [railOpen, setRailOpen] = useState(false);
  const [agentQuestion, setAgentQuestion] = useState(SUPPORTED_SCENARIO_QUESTION);
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | running | refused
  const [scopeLabel, setScopeLabel] = useState("Cross-border · US · HK · SG · EU");
  const [handoffCopied, setHandoffCopied] = useState(false);
  const [step, setStep] = useState(1); // 1 brief · 2 decision · 3 anchor · 4 handoff
  const [decision, setDecision] = useState("review");
  const [receipt, setReceipt] = useState(null);
  const [existingDeploymentAddress, setExistingDeploymentAddress] = useState(
    "0xc7AE2D5e83d5Fc3fC05e618E60807E05D5E57e15",
  );
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
      if (evaluateAgentCoverage(agentQuestion)) {
        setScopeLabel("Cross-border · US · HK · SG · EU");
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
      const item = RWA_EVIDENCE.find((entry) => entry.id === jurisdictionId);
      setOpenMarkerId(jurisdictionId);
      setScopeLabel(`${item.title} · single jurisdiction`);
    } else {
      setOpenMarkerId(null);
      setScopeLabel("Cross-border · US · HK · SG · EU");
    }
    setSearchStatus("idle");
    setStage("app");
  }

  // After human review, emit a machine-actionable handoff a downstream agent can
  // run against — the verified scope, the human decision, and the receipt proof.
  function buildAgentHandoff() {
    if (!receipt) return "";
    const signals = RWA_EVIDENCE.reduce((acc, item) => {
      acc[item.id] = item.signal;
      return acc;
    }, {});
    const facts = {
      caseRef: receipt.evidenceSet.decision.caseRef,
      reviewScope: scopeLabel,
      signals,
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
    return [
      "# LUO verified decision handoff",
      "",
      "## Verified facts",
      "```json",
      JSON.stringify(facts, null, 2),
      "```",
      "",
      "## Constraints for the downstream agent",
      "Act only within this human-verified scope. Do not exceed it or infer coverage for an `Unresolved` jurisdiction.",
      "",
      "- **United States** — candidate Rule 506(c) workstream; counsel confirms availability and scope.",
      "- **Hong Kong** — licensed-intermediary and product-control questions remain conditionally scoped.",
      "- **Singapore** — current source pack has no specific provision supporting a broader path.",
      "- **European Union** — classification remains unresolved in the current pack.",
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
      });
      setReceipt(nextReceipt);
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
        contractAddress: mined.contractAddress,
        unverifiedContractAddress: null,
        preview: null,
        estimate: null,
        txHash: transaction.hash,
        message: "Receipt anchor is visible on-chain and runtime verified. Prepare a fresh Proceed receipt before anchoring it.",
      });
      setReceipt(null);
      setDecision("review");
    } catch (error) {
      setAnchor((current) => ({ ...current, status: "error", message: getErrorMessage(error) }));
    }
  }

  async function recoverExistingDeployment() {
    setAnchor((current) => ({ ...current, status: "verifying-deployment", message: null }));
    try {
      const receiptAnchorClient = await getReceiptAnchorClient();
      const verification = await receiptAnchorClient.verifyDeployedRuntimeBytecode({
        provider: await getTestnetReceiptReader(),
        contractAddress: existingDeploymentAddress,
      });
      setAnchor({
        status: "deployed",
        contractAddress: verification.contractAddress,
        unverifiedContractAddress: null,
        preview: null,
        estimate: null,
        txHash: null,
        message: "Existing receipt anchor verified. Prepare a fresh Proceed receipt before anchoring it.",
      });
      setExistingDeploymentAddress("");
      setReceipt(null);
      setDecision("review");
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
      });
      if (record.submitter.toLowerCase() !== wallet.address.toLowerCase() || record.evidenceHash !== receipt.evidenceHash) {
        throw new Error("The confirmed record does not match the reviewed receipt.");
      }
      setAnchor((current) => ({
        ...current,
        status: "anchored",
        preview: null,
        estimate: null,
        txHash: transaction.hash,
        message: "Proceed receipt is confirmed on Injective EVM Testnet.",
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
              placeholder="Ask a cross-border RWA question…"
              aria-label="Ask a cross-border RWA question"
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
            <span>Evidence-bound decision record for tokenized RWA actions · Injective testnet demo</span>
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
            ? `Injective Testnet · ${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
            : wallet.status === "connecting"
              ? "Connecting test wallet…"
              : wallet.status === "error"
                ? "Wallet unavailable · retry"
              : "Injective Testnet · connect wallet"}
        </button>
      </header>

      <main className="atlas-layout">
        <section className="atlas-stage" aria-label="Cross-border evidence map">
          <div className="atlas-intro">
            <p>Evidence map</p>
            <h1>Cross-border<br />jurisdiction</h1>
            <span className="scope-line">Agent-routed across {scopeLabel.includes("single") ? "one human-verified source" : "four human-verified sources"}</span>
          </div>

          <img className="atlas-map" src="/atlas-map.png" alt="Abstract world map with cross-border connection lines" />

          <div className="markers" aria-label="Jurisdiction signals">
            {RWA_EVIDENCE.map((item) => (
              <button
                key={item.id}
                className={`${item.className} ${openMarkerId === item.id ? "is-selected" : ""}`}
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
            <span>Demo map</span>
            Information relationships only · not a representation of jurisdictional boundaries.
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
                {[["1", "Action plan"], ["2", "Decision"], ["3", "Anchor"], ["4", "Handoff"]].map(([n, label]) => (
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
                      {ACTION_PLAN.startHere.text}{" "}
                      <a className="template-link" href={ACTION_PLAN.startHere.url} target="_blank" rel="noreferrer">
                        {ACTION_PLAN.startHere.label} ↗
                      </a>
                    </p>
                  </div>
                  <div className="reco-materials">
                    <div>
                      <h4>Need</h4>
                      <ul>
                        {ACTION_PLAN.materials.need.map((m) => (
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
                      <ul>{ACTION_PLAN.materials.likelyHave.map((m) => <li key={m}>{m}</li>)}</ul>
                    </div>
                    <div>
                      <h4>Take to local counsel</h4>
                      <ul>{ACTION_PLAN.materials.counsel.map((m) => <li key={m}>{m}</li>)}</ul>
                    </div>
                  </div>
                  <p className="reco-disclaimer">This narrows the next work; it does not determine where an asset may be offered or transferred. Take this brief and the linked sources to qualified local counsel.</p>
                  <div className="sheet-nav">
                    <button className="decision-button" onClick={() => setStep(2)}>Continue to decision →</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="sheet-step-panel">
                  <p className="sheet-kicker">Step 2 · Human decision</p>
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
                    <small id="scenario-reference-help">All 4 reviewed signals · uppercase on receipt · non-sensitive only</small>
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
                        <small>{receipt.evidenceSet.decision.caseRef} · 4-jurisdiction review scope</small>
                      </div>
                      <div className="sheet-nav">
                        <button className="decision-button" onClick={() => setStep(3)}>Continue to anchoring →</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="sheet-step-panel">
                  <p className="sheet-kicker">Step 3 · Anchor on Injective EVM testnet</p>
                  <h2>Anchor the receipt</h2>
                  {!receipt && <p className="sheet-hint">Complete the decision in step 2 first.</p>}
                  {receipt && (
                    <>
                      {wallet.status !== "connected" && (
                        <button className="testnet-review-button" onClick={connectTestWallet}>Connect wallet</button>
                      )}
                      {!anchor.contractAddress && (
                        <section className="deployment-recovery" aria-label="Verify receipt anchor contract">
                          <span>Receipt-anchor contract</span>
                          <input
                            value={existingDeploymentAddress}
                            onChange={(event) => setExistingDeploymentAddress(event.target.value)}
                            placeholder="Receipt-anchor contract address"
                            aria-label="Receipt-anchor contract address"
                          />
                          <button
                            className="testnet-review-button"
                            onClick={recoverExistingDeployment}
                            disabled={anchor.status === "verifying-deployment"}
                          >
                            {anchor.status === "verifying-deployment" ? "Verifying contract…" : "Verify receipt-anchor contract"}
                          </button>
                        </section>
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
                          <span>Testnet transaction preview</span>
                          <dl>
                            <div><dt>Action</dt><dd>{anchor.preview.label}</dd></div>
                            <div><dt>Target</dt><dd>{anchor.preview.to}</dd></div>
                            <div><dt>Transfer</dt><dd>0 INJ</dd></div>
                            <div><dt>Maximum fee</dt><dd>{anchor.estimate.displayFee === null ? "Unavailable" : `${anchor.estimate.displayFee} INJ`}</dd></div>
                          </dl>
                          <button className="decision-button" onClick={confirmReceiptAnchor} disabled={anchor.status === "submitting-anchor"}>
                            {anchor.status === "submitting-anchor" ? "Waiting for receipt confirmation…" : "Confirm anchor in wallet"}
                          </button>
                        </section>
                      )}
                      {anchor.message && <p className={`testnet-message testnet-message--${anchor.status}`}>{anchor.message}</p>}
                      {anchor.status === "anchored" && (
                        <div className="sheet-nav">
                          <button className="decision-button" onClick={() => setStep(4)}>Continue to handoff →</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="sheet-step-panel">
                  <p className="sheet-kicker">Step 4 · On-chain proof &amp; agent handoff</p>
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
                        </div>
                        <p className="reco-disclaimer">This brief stays off-chain. Only the receipt hash is anchored on-chain.</p>
                      </section>
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
