import { useMemo, useState } from "react";

const evidence = [
  {
    id: "US-RWA-001",
    title: "United States",
    signal: "Restrictive",
    detail: "Eligibility and distribution structure need a separate review.",
    tone: "coral",
    className: "marker marker--us",
  },
  {
    id: "HK-RWA-002",
    title: "Hong Kong",
    signal: "Evolving",
    detail: "The market route depends on jurisdiction-specific interpretation.",
    tone: "gold",
    className: "marker marker--hk",
  },
  {
    id: "CH-RWA-003",
    title: "Switzerland",
    signal: "Unresolved",
    detail: "The available signal does not establish a single RWA distribution conclusion.",
    tone: "blue",
    className: "marker marker--switzerland",
  },
];

export function App() {
  const [selectedId, setSelectedId] = useState("US-RWA-001");
  const [decision, setDecision] = useState("review");
  const selectedEvidence = useMemo(
    () => evidence.find((item) => item.id === selectedId),
    [selectedId],
  );

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
        <div className="testnet-status"><span /> Injective Testnet · draft mode</div>
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
            {evidence.map((item) => (
              <button
                key={item.id}
                className={`${item.className} ${selectedId === item.id ? "is-selected" : ""}`}
                onClick={() => setSelectedId(item.id)}
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
            <button className="decision-button" onClick={() => setDecision("draft")}>Prepare testnet receipt</button>
          </div>

          <div className={`decision-state decision-state--${decision}`}>
            {decision === "review" && "No legal conclusion is produced."}
            {decision === "hold" && "Held. No receipt created."}
            {decision === "draft" && "Draft ready. Wallet signing remains disabled."}
          </div>
        </aside>
      </main>

      <footer className="footer">
        <span>Evidence-first · Jurisdiction-aware · Human-in-the-loop</span>
        <span>Private keys never enter this application.</span>
      </footer>
    </div>
  );
}
