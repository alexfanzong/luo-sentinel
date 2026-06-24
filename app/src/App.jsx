import { useMemo, useState } from "react";
import { hexlify, randomBytes } from "ethers";
import { connectToInjectiveEvmTestnet, INJECTIVE_EVM_TESTNET } from "./lib/injectiveEvm.js";
import { createProceedReceiptDraft, getSafeDecisionTimestamp } from "./lib/onchainReceipt.js";
import { RWA_EVIDENCE } from "./lib/rwaEvidence.js";

export function App() {
  const [selectedId, setSelectedId] = useState(RWA_EVIDENCE[0].id);
  const [caseRef, setCaseRef] = useState("RWA-DEMO-001");
  const [decision, setDecision] = useState("review");
  const [receipt, setReceipt] = useState(null);
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
  const selectedEvidence = useMemo(
    () => RWA_EVIDENCE.find((item) => item.id === selectedId),
    [selectedId],
  );
  const isDeploymentPreview = anchor.preview?.kind === "contract-deployment";

  async function connectTestWallet() {
    setWallet({ status: "connecting", address: null, message: null });

    try {
      const connection = await connectToInjectiveEvmTestnet(window.ethereum);
      setWallet({ status: "connected", address: connection.address, message: null });
    } catch (error) {
      setWallet({ status: "error", address: null, message: error.message });
    }
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
    setSelectedId(id);
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
      const mined = await transaction.wait();
      if (!mined?.contractAddress) {
        throw new Error("The deployment was mined without a contract address.");
      }
      try {
        await receiptAnchorClient.verifyDeployedRuntimeBytecode({
          provider,
          contractAddress: mined.contractAddress,
        });
      } catch (error) {
        setAnchor({
          status: "error",
          contractAddress: null,
          unverifiedContractAddress: mined.contractAddress,
          preview: null,
          estimate: null,
          txHash: transaction.hash,
          message: `Deployment was mined but its runtime was not verified. It will not be used: ${getErrorMessage(error)}`,
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
        message: "Receipt anchor deployed and runtime verified. Prepare a fresh Proceed receipt before anchoring it.",
      });
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
      await transaction.wait();
      const record = await receiptAnchorClient.readAnchoredReceipt({
        provider,
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
            <span>Review regulatory divergence before a human records the next step.</span>
          </div>

          <img className="atlas-map" src="/atlas-map.png" alt="Abstract world map with cross-border connection lines" />

          <div className="markers" aria-label="Jurisdiction signals">
            {RWA_EVIDENCE.map((item) => (
              <button
                key={item.id}
                className={`${item.className} ${selectedId === item.id ? "is-selected" : ""}`}
                onClick={() => selectEvidence(item.id)}
                aria-pressed={selectedId === item.id}
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
        </section>

        <aside className="decision-rail" aria-label="Human decision">
          <p>Decision rail</p>
          <h2>Next step</h2>
          <span className="rail-lede">Evidence diverges. A human decides what happens next.</span>

          <section className="selected-evidence">
            <span className={`signal signal--${selectedEvidence.tone}`}>{selectedEvidence.signal}</span>
            <h3>{selectedEvidence.title}</h3>
            <small>Source anchor · {selectedEvidence.id}</small>
          </section>

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

          <div className="rail-actions">
            <p className="human-gate">Human review required</p>
            <button className="decision-button decision-button--quiet" onClick={() => setDecision("hold")}>Hold for counsel</button>
            <button className="decision-button" onClick={prepareReceiptDraft} disabled={decision === "preparing"}>
              {decision === "preparing" ? "Preparing commitment…" : "Prepare testnet decision receipt"}
            </button>
          </div>

          <div className={`decision-state decision-state--${decision}`}>
            {decision === "review" && "No legal conclusion, compliance determination, or asset authorization is produced."}
            {decision === "hold" && "Held. No receipt created."}
            {decision === "preparing" && "Creating a local public commitment."}
            {decision === "draft" && (wallet.status === "connected"
              ? "Proceed receipt ready. No transaction has been submitted."
              : "Receipt draft ready. Connect a test wallet before a future signing step.")}
            {decision === "wallet-required" && "Connect a test wallet before preparing a Proceed receipt."}
            {decision === "error" && "Receipt could not be prepared. No wallet action occurred."}
          </div>
          {receipt && (
            <div className="receipt-commitment">
              <span>Proceed receipt · local only</span>
              <code>{receipt.receiptHash.slice(0, 18)}…{receipt.receiptHash.slice(-8)}</code>
              <small>{receipt.evidenceSet.decision.caseRef} · 4-jurisdiction review scope</small>
            </div>
          )}
          {receipt && !anchor.contractAddress && anchor.status !== "deployment-reviewed" && anchor.status !== "submitting-deployment" && (
            <button className="testnet-review-button" onClick={reviewDeployment} disabled={anchor.status === "estimating"}>
              {anchor.status === "estimating" ? "Estimating testnet fee…" : "Review contract deployment"}
            </button>
          )}
          {anchor.preview && anchor.estimate && (
            <section className="transaction-preview" aria-label="Testnet transaction preview">
              <span>Testnet transaction preview</span>
              <dl>
                <div><dt>Action</dt><dd>{anchor.preview.label}</dd></div>
                <div><dt>Target</dt><dd>{anchor.preview.to || "Create new contract"}</dd></div>
                <div><dt>Transfer</dt><dd>0 INJ</dd></div>
                <div><dt>Maximum fee</dt><dd>{anchor.estimate.displayFee === null ? "Unavailable" : `${anchor.estimate.displayFee} INJ`}</dd></div>
              </dl>
              <button
                className="decision-button"
                onClick={isDeploymentPreview ? confirmDeployment : confirmReceiptAnchor}
                disabled={anchor.status === "submitting-deployment" || anchor.status === "submitting-anchor"}
              >
                {anchor.status === "submitting-deployment"
                  ? "Waiting for deployment confirmation…"
                  : anchor.status === "submitting-anchor"
                    ? "Waiting for receipt confirmation…"
                    : isDeploymentPreview
                      ? "Confirm deployment in wallet"
                      : "Confirm receipt anchor in wallet"}
              </button>
            </section>
          )}
          {receipt && anchor.contractAddress && (anchor.status === "ready-to-anchor" || anchor.status === "error") && (
            <button className="testnet-review-button" onClick={reviewReceiptAnchor}>Review receipt anchor</button>
          )}
          {anchor.status === "deployed" && (
            <div className="testnet-result">
              <span>Contract deployed</span>
              <code>{anchor.contractAddress.slice(0, 12)}…{anchor.contractAddress.slice(-8)}</code>
            </div>
          )}
          {anchor.unverifiedContractAddress && (
            <div className="testnet-result">
              <span>Unverified deployment · not used</span>
              <code>{anchor.unverifiedContractAddress.slice(0, 12)}…{anchor.unverifiedContractAddress.slice(-8)}</code>
            </div>
          )}
          {anchor.message && <p className={`testnet-message testnet-message--${anchor.status}`}>{anchor.message}</p>}
          {anchor.txHash && (
            <a className="explorer-link" href={`${INJECTIVE_EVM_TESTNET.blockExplorerUrl}tx/${anchor.txHash}`} target="_blank" rel="noreferrer">
              View testnet transaction ↗
            </a>
          )}
        </aside>
      </main>

      <footer className="footer">
        <span>Evidence-first · Jurisdiction-aware · Human-in-the-loop</span>
        <span>Testnet decision record · not legal advice · does not establish compliance or authorize an asset transaction.</span>
      </footer>
    </div>
  );
}
