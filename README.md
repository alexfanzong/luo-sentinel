# LUO Sentinel

Website: [https://luo-sentinel.vercel.app](https://luo-sentinel.vercel.app)

LUO Sentinel turns reviewed regulatory source anchors into scoped, auditable AI
action handoffs for RWA compliance workflows. The map is a current evidence
snapshot, not a live legal conclusion; every Proceed decision is bounded by
human review and a verifiable receipt.

LUO Sentinel makes jurisdictional divergence visible before a human records a
next step for a tokenized-asset scenario. The demo can preserve distinct
signals for the United States, Hong Kong, Singapore, and European Union, or
shrink to a single jurisdiction such as Hong Kong. In either mode, the product
requires a review council and a human decision rather than manufacturing a
universal legal conclusion. These are scoped Ondo OUSG RWA sample signals, not
jurisdiction-wide legal conclusions.

The current evidence map is derived from a reviewed OUSG sample evidence pack
last reviewed on `2026-06-07`. In production, the evidence layer would refresh
from primary legal/regulatory sources and mark stale signals for re-review when
source materials change.

Each `Proceed` receipt binds one non-sensitive scenario reference to the
selected evidence scope and deterministic reviewer scorecards. Choosing a
single jurisdiction narrows the receipt and handoff to that source scope; it
does not imply approval for that jurisdiction or a Hold for any other
jurisdiction.

## Demo proof

The product proof is not that LUO can answer every RWA question. It is that an
agent can be forced to stay inside a reviewed evidence boundary before it moves
toward execution.

1. **Refuse unsupported scope** — an out-of-scope question is rejected or routed
   back to a reviewed evidence pack instead of producing a fabricated
   compliance map.
2. **Preserve or narrow scope** — the Atlas Canvas can keep United States, Hong
   Kong, Singapore, and European Union separate, or narrow to one reviewed
   source such as Hong Kong.
3. **Run the Review Council** — deterministic Scope, Source, and Risk agents
   review the selected evidence before a human can create a receipt. Scores use
   a fixed demo rubric over coverage, authority fit, claim support, and
   residual risk; they are not LLM confidence scores.
4. **Require human review** — the Decision Rail turns the evidence pack into a
   source-bounded action plan, then requires a human to Hold or Proceed.
5. **Anchor responsibility, not legal content** — a Proceed decision can be
   recorded as a zero-value Injective EVM Testnet receipt hash after wallet
   review and runtime-bytecode verification.
6. **Run bounded handoff** — the downstream agent consumes the verified scope,
   decision, receipt proof, and reviewer objections, then produces a scoped
   counsel-preparation checklist instead of a universal legal answer.

## Prototype

The current Atlas Canvas prototype lives in [`app/`](./app). It uses a map-first
interface with interactive jurisdiction signals and a human decision rail.

Deployed app: [https://luo-sentinel.vercel.app](https://luo-sentinel.vercel.app)

```bash
cd app
npm install --ignore-scripts
npm run dev
```

## Safety boundary

The prototype does not move assets, make legal determinations, establish
compliance, authorize an asset transaction, or transmit a private key. An
operator can choose to connect a test-only MetaMask-compatible wallet to
Injective EVM Testnet; the browser wallet keeps control of the account and may
be disconnected at any time. `Prepare testnet decision receipt` creates an
on-chain-compatible receipt draft locally. A separate review panel then shows
the exact zero-value testnet operation and a fresh fee estimate. Nothing reaches
the wallet until the operator clicks the explicit confirmation button; the
wallet remains the final confirmation authority. After a deployment is mined,
the app reads its runtime bytecode and accepts it only if its hash matches the
locally reviewed contract artifact. The verified Injective integration boundary is documented in
[docs/INJECTIVE_INTEGRATION.md](./docs/INJECTIVE_INTEGRATION.md).

## What goes on-chain

On-chain:

- receipt hash;
- evidence manifest hash;
- product reference hash;
- reviewer-controlled submitting wallet;
- decision timestamp.

Off-chain:

- legal source text;
- action-plan narrative;
- deterministic reviewer scorecard details;
- downstream agent handoff brief and bounded checklist;
- private keys, seed phrases, personal data, and legal conclusions.

## Live testnet proof

The demo has a user-confirmed, zero-value Injective EVM Testnet contract
interaction:

- Transaction:
  [`0x17ae3d575955edb1c2e8d608641fb36d03a5c456dcacf0ca245bc0f9ed34c2eb`](https://testnet.blockscout.injective.network/tx/0x17ae3d575955edb1c2e8d608641fb36d03a5c456dcacf0ca245bc0f9ed34c2eb)
- Contract:
  [`0xc7AE2D5e83d5Fc3fC05e618E60807E05D5E57e15`](https://testnet.blockscout.injective.network/address/0xc7AE2D5e83d5Fc3fC05e618E60807E05D5E57e15)
- Chain ID: `1439`
- Transfer value: `0 INJ`
- Receipt status: confirmed

## Nova deliverables in progress

- [x] Public-safe project frame and prototype
- [x] Interactive jurisdiction map and human-review flow
- [x] Injective EVM Testnet browser-wallet connection layer
- [x] Locally tested, wallet-bound Proceed receipt contract
- [x] Three-minute demo script
- [x] Pitch deck outline
- [x] User-confirmed live test-wallet connection
- [x] User-confirmed non-value-moving testnet receipt
- [x] Deployed demo URL
- [ ] Three-minute demo video
- [ ] Final designed pitch deck
