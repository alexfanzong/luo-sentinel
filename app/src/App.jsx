import { useMemo, useState } from "react";
import { connectToInjectiveEvmTestnet } from "./lib/injectiveEvm.js";
import { createReceiptCommitment } from "./lib/receiptCommitment.js";
import { RWA_EVIDENCE } from "./lib/rwaEvidence.js";

export function App() {
  const [selectedId, setSelectedId] = useState(RWA_EVIDENCE[0].id);
  const [decision, setDecision] = useState("review");
  const [receipt, setReceipt] = useState(null);
  const [wallet, setWallet] = useState({ status: "disconnected", address: null, message: null });
  const selectedEvidence = useMemo(
    () => RWA_EVIDENCE.find((item) => item.id === selectedId),
    [selectedId],
  );

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
    setDecision("preparing");

    try {
      const nextReceipt = await createReceiptCommitment({
        sourceAnchorId: selectedEvidence.id,
        timestamp: new Date().toISOString(),
      });
      setReceipt(nextReceipt);
      setDecision("draft");
    } catch {
      setReceipt(null);
      setDecision("error");
    }
  }

  function selectEvidence(id) {
    setSelectedId(id);
    setReceipt(null);
    setDecision("review");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="identity">
          <img src="/luo-logo.png" alt="LUO" className="logo" />
          <span className="topbar-divider" />
          <div>
            <strong>LUO Sentinel</strong>
            <span>Compliance preflight for tokenized RWA actions on Injective testnet</span>
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
            <span>Map regulatory divergence before a tokenized asset action proceeds.</span>
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

          <div className="rail-actions">
            <p className="human-gate">Human review required</p>
            <button className="decision-button decision-button--quiet" onClick={() => setDecision("hold")}>Hold for counsel</button>
            <button className="decision-button" onClick={prepareReceiptDraft} disabled={decision === "preparing"}>
              {decision === "preparing" ? "Preparing commitment…" : "Prepare testnet receipt"}
            </button>
          </div>

          <div className={`decision-state decision-state--${decision}`}>
            {decision === "review" && "No legal conclusion is produced."}
            {decision === "hold" && "Held. No receipt created."}
            {decision === "preparing" && "Creating a local public commitment."}
            {decision === "draft" && (wallet.status === "connected"
              ? "Commitment ready. Wallet signing remains disabled."
              : "Commitment ready. Connect a test wallet before a future signing step.")}
            {decision === "error" && "Receipt could not be prepared. No wallet action occurred."}
          </div>
          {receipt && (
            <div className="receipt-commitment">
              <span>Public commitment · local only</span>
              <code>{receipt.commitment.slice(0, 18)}…{receipt.commitment.slice(-8)}</code>
            </div>
          )}
        </aside>
      </main>

      <footer className="footer">
        <span>Evidence-first · Jurisdiction-aware · Human-in-the-loop</span>
        <span>Private keys never enter this application · no signature or transfer is initiated.</span>
      </footer>
    </div>
  );
}
