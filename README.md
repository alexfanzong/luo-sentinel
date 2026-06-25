# LUO Sentinel

Evidence-bound AI handoffs for RWA compliance workflows.

[Live Demo](https://luo-sentinel.vercel.app) · [Repository](https://github.com/alexfanzong/luo-sentinel) · [Demo Script](docs/DEMO_SCRIPT.md) · [Pitch Deck Outline](docs/PITCH_DECK.md)

## Table of Contents

- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [How The Evidence Map Works](#how-the-evidence-map-works)
- [Safety Boundary](#safety-boundary)
- [Roadmap](#roadmap)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

## About The Project

LUO Sentinel turns reviewed regulatory source anchors into scoped, auditable AI
action handoffs for tokenized RWA workflows. The demo shows how an AI-facing
system can refuse unsupported scope, preserve jurisdictional divergence, require
human review, and anchor a non-sensitive Proceed receipt before any downstream
agent acts.

The map is not a live legal conclusion. It is a snapshot of a reviewed evidence
pack that can be refreshed as primary legal and regulatory sources change.

Key ideas:

- **Verified evidence first** — the app starts from reviewed source anchors, not
  open-ended model output.
- **Scope before action** — the Review Council checks whether a source is being
  interpreted too broadly before a human can proceed.
- **Human-gated receipts** — a Proceed decision creates a local commitment that
  can be anchored as a zero-value testnet receipt hash.
- **Bounded handoff** — downstream agents receive only the approved scope,
  reviewer objections, and receipt proof.

## Built With

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [ethers.js](https://docs.ethers.org/)
- [Foundry](https://book.getfoundry.sh/)
- [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- Foundry, for Solidity build and bytecode verification tests
- A MetaMask-compatible browser wallet for the optional testnet flow

### Installation

1. Clone the repository.

   ```bash
   git clone https://github.com/alexfanzong/luo-sentinel.git
   cd luo-sentinel
   ```

2. Install the app dependencies.

   ```bash
   cd app
   npm install --ignore-scripts
   ```

3. Start the local app.

   ```bash
   npm run dev
   ```

4. Run the test suite.

   ```bash
   npm test
   ```

5. Build the production bundle.

   ```bash
   npm run build
   ```

## Usage

Use the default RWA scenario or ask a scoped OUSG question from the landing
search. The app routes only to reviewed evidence scopes; unsupported questions
are refused or narrowed to a known source scope.

Demo path:

1. Open the [live demo](https://luo-sentinel.vercel.app).
2. Run the default cross-border OUSG query, or ask `Can we launch OUSG in Hong Kong only?` and choose the Hong Kong scope.
3. Inspect the evidence map and source anchors.
4. Open the workflow rail and review the action plan.
5. Continue to the Review Council to see scope, source-fit, and claim-support checks.
6. Connect a test-only wallet and prepare a Proceed receipt.
7. Review and confirm the zero-value testnet contract deployment, then review and confirm the receipt anchor.
8. Run the bounded downstream agent to produce a counsel-preparation checklist.

## How The Evidence Map Works

The current map is derived from a reviewed OUSG sample evidence pack last
reviewed on `2026-06-07`.

Each jurisdiction signal contains:

- a source anchor;
- a scoped signal, such as Restricted, Conditional, or Unresolved;
- a summary of what the source supports;
- a boundary for what the source does not prove.

In production, the evidence layer would refresh from primary legal and
regulatory sources such as regulator websites, official legal databases, or
trusted MCP connectors. LLMs can help extract candidate claims, but those claims
should become map signals only after expert or human verification. When source
materials change, stale signals should be marked for re-review before they are
used in a new handoff.

The Review Council does not check whether an official database is "real." It
checks whether the selected source is being applied too broadly, whether the
claim is supported, and whether the downstream agent must remain limited to
counsel-preparation work.

## Safety Boundary

LUO Sentinel does not:

- move assets;
- make legal determinations;
- establish compliance;
- authorize an asset transaction;
- transmit private keys, seed phrases, or legal source text on-chain.

On-chain, the demo anchors only:

- receipt hash;
- evidence manifest hash;
- product reference hash;
- reviewer-controlled submitting wallet;
- decision timestamp.

Off-chain, the app keeps:

- legal source text;
- action-plan narrative;
- reviewer scorecards;
- downstream handoff brief;
- counsel-preparation checklist.

The browser wallet remains the final confirmation authority for every testnet
transaction. The app verifies deployed runtime bytecode before accepting a
receipt-anchor contract. The full integration boundary is documented in
[docs/INJECTIVE_INTEGRATION.md](docs/INJECTIVE_INTEGRATION.md).

## Roadmap

- [x] Public-safe project frame and deployed app
- [x] Reviewed RWA evidence map with jurisdiction-specific source anchors
- [x] Single-jurisdiction and cross-border review scopes
- [x] Review Council with deterministic scope, source-fit, and risk checks
- [x] Wallet-gated Proceed receipt flow
- [x] Zero-value testnet contract deployment and receipt anchoring
- [x] Bounded downstream agent checklist
- [x] Demo script and pitch deck outline
- [ ] Three-minute demo video
- [ ] Final designed pitch deck
- [ ] Live LLM/legal reviewer agent integration
- [ ] Refresh pipeline for primary legal and regulatory sources

## License

No license has been declared yet.

## Contact

Project Link: [https://github.com/alexfanzong/luo-sentinel](https://github.com/alexfanzong/luo-sentinel)

Live Demo: [https://luo-sentinel.vercel.app](https://luo-sentinel.vercel.app)

## Acknowledgments

- The README structure follows the public layout pattern from
  [othneildrew/Best-README-Template](https://github.com/othneildrew/Best-README-Template).
- Regulatory source anchors in this demo are scoped sample signals, not
  jurisdiction-wide legal conclusions.
