# LUO Sentinel

> Evidence-bound AI Sentinel for RWA actions on Injective.

<p align="center">
  <img src="app/public/luo-mark.png" alt="LUO Sentinel logo" width="170" />
</p>

<p align="center">
  <a href="README.zh-CN.md">中文</a> ·
  <a href="https://luo-sentinel.vercel.app">Live Demo</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/RWA-Compliance-111827?style=for-the-badge" alt="RWA Compliance" />
  <img src="https://img.shields.io/badge/AI-Agent%20Handoff-0f766e?style=for-the-badge" alt="AI Agent Handoff" />
  <img src="https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Solidity-0.8.33-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity 0.8.33" />
  <img src="https://img.shields.io/badge/License-Apache--2.0-5aa000?style=for-the-badge" alt="Apache-2.0 license" />
</p>

LUO Sentinel is an evidence-bound guard layer for RWA actions on Injective. It turns reviewed regulatory source anchors into a visual evidence map, then requires Sentinel review, a human gate, and a verifiable receipt before any downstream agent acts.

The project is not about asking AI to produce a legal conclusion such as "this asset can be issued or transferred here." It demonstrates a safer path: hold the action, verify the source boundary, then decide what an AI agent is allowed to do.

The map is not a live legal conclusion. It is a snapshot of a reviewed evidence pack. When regulatory sources change, affected signals must be reviewed again.

## Evidence Map Screenshot

<p align="center">
  <img src="app/public/readme-evidence-map.png" alt="LUO Sentinel four-jurisdiction evidence map" width="820" />
</p>

## Demo

Live app: [https://luo-sentinel.vercel.app](https://luo-sentinel.vercel.app)

Suggested reviewer path:

1. In the empty search box, ask the cross-border prompt:
   `We're launching a tokenized US Treasury (OUSG) product, where can we legally offer and transfer it?`
2. Open the jurisdiction markers and check that each signal links to its cited source anchor.
3. Continue through Action Plan, Agent Review, Human Gate, Testnet Anchor, and Handoff.
4. Run the bounded downstream agent and confirm that it creates a counsel-preparation checklist, not a legal conclusion.
5. Restart and ask the Hong Kong-only prompt:
   `Can we launch OUSG in Hong Kong only?`
6. Confirm that the map narrows to the Hong Kong source scope and does not infer U.S., Singapore, or EU coverage.

## About The Project

LUO Sentinel demonstrates a minimal AI x Web3 Sentinel loop:

1. A proposed RWA action is held before execution.
2. The system routes it only into reviewed evidence scopes.
3. The map shows jurisdiction-specific source anchors and risk boundaries.
4. The Review Council checks whether a source is being over-interpreted.
5. A human gate decides whether to Proceed.
6. A bounded Sentinel receipt can be anchored on testnet.
7. A downstream agent can only produce a counsel-preparation checklist within the approved scope.

## Core Features

- **Reviewed evidence map**  
  The map comes from reviewed source anchors, not live model-generated legal conclusions.

- **Cross-border / single-jurisdiction scope**  
  The demo can preserve differences across the United States, Hong Kong, Singapore, and the European Union, or narrow to a Hong Kong-only scope.

- **Agent Review Council**  
  Three reviewers check scope, source fit, claim support, and action risk. Scores are audit weights, not LLM confidence.

- **Human-gated receipt**  
  The Sentinel receipt creates a reviewer-wallet decision record for the approved evidence scope.

- **Zero-value testnet anchoring**  
  Wallet confirmation is real for contract deployment and receipt anchoring, but no asset is moved.

- **Bounded downstream agent**  
  The downstream agent can only generate a counsel-preparation checklist inside the approved scope.

## Receipt Boundary

LUO Sentinel anchors a zero-value decision receipt on testnet. The receipt commits to the reviewed evidence scope, product reference, reviewer wallet, and decision time without putting legal analysis or source text on-chain.

It proves that a wallet accepted a bounded AI handoff after review. It does not prove legal compliance, create a legal opinion, or authorize an asset transaction. The implementation can be inspected in the contract and tests.

## How The Evidence Map Is Built

The current demo map is derived from a reviewed OUSG sample evidence pack last reviewed on `2026-06-07`.

Each jurisdiction signal contains:

- source anchor;
- signal status, such as Restricted, Conditional, or Unresolved;
- what the source supports;
- what the source does not prove.

In production, the evidence layer can connect to regulator websites, official legal databases, or trusted MCP connectors. LLMs can help extract candidate claims, but those claims should become map signals only after expert or human verification. When regulatory sources change, stale signals should be marked for re-review.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, CSS |
| Wallet / Testnet | ethers.js, MetaMask-compatible wallet |
| Smart Contract | Solidity, Foundry |
| Deployment | Vercel |

## Quick Start

```bash
git clone https://github.com/alexfanzong/luo-sentinel.git
cd luo-sentinel/app
npm install --ignore-scripts
npm run dev
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## Project Structure

```text
.
├── app/
│   ├── public/                  # Logo and map assets
│   ├── src/
│   │   ├── lib/                 # Evidence, receipts, review council, wallet helpers
│   │   ├── App.jsx              # Main demo flow
│   │   └── styles.css           # UI styles
│   └── package.json
├── contracts/
│   └── LUOReceiptAnchor.sol     # Receipt-anchor contract
├── docs/
│   ├── DEMO_SCRIPT.md
│   └── INJECTIVE_INTEGRATION.md
├── test/
│   └── LUOReceiptAnchor.t.sol
└── vercel.json
```

## Safety Boundary

LUO Sentinel does not:

- move assets;
- make legal determinations;
- establish compliance;
- authorize token issuance or transfer;
- put private keys, seed phrases, or legal text on-chain.

On-chain, the demo anchors only:

- receipt hash;
- evidence manifest hash;
- product reference hash;
- reviewer wallet;
- decision timestamp.

Off-chain, the app keeps legal source text, action-plan narrative, reviewer scorecards, downstream handoff brief, and counsel-preparation checklist.

## Product Roadmap

### 1. Evidence Infrastructure

- Connect primary legal and regulatory sources through official databases, regulator websites, or trusted MCP connectors.
- Add source-change detection, stale-signal marking, and re-review workflows.
- Expand beyond the OUSG sample into reusable RWA evidence graphs.

### 2. Agent Review Layer

- Replace deterministic demo reviewers with live LLM/legal reviewer agents.
- Track reviewer reputation, evaluation records, and disagreement history.
- Support multi-agent review for source fit, jurisdiction scope, claim support, and action risk.

### 3. Handoff And Receipt Protocol

- Standardize machine-readable handoff formats for downstream agents.
- Add receipt verification endpoints and explorer-friendly receipt views.
- Support policy-controlled agent execution after human-approved scope.

### 4. Productization

- Build workspace features for teams, counsel, and compliance reviewers.
- Add case history, audit trails, and evidence refresh notifications.
- Support enterprise deployment patterns for legal, compliance, and RWA operations teams.

## License

The source code is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

LUO Sentinel is a hackathon research demo. The LUO Sentinel name, logo, demo evidence pack, regulatory source summaries, evidence map, and compliance workflow narrative do not grant legal, compliance, trademark, commercial endorsement, investment advice, or authorization rights. The demo should not be used as a substitute for advice from licensed counsel or regulated compliance professionals.

## Contact

Alex Fan  
Cornell Law School  
Programmable Compliance Architect  
X: [@itsAlexFan](https://x.com/itsAlexFan)
