# LUO Sentinel

**Evidence-bound decision record for AI-initiated RWA actions on Injective Testnet.**

LUO Sentinel makes jurisdictional divergence visible before a human records a
next step for a tokenized-asset scenario. The demo preserves distinct signals
for the United States, Hong Kong, Singapore, and European Union, then requires
a human decision rather than manufacturing a universal legal conclusion. These
are scoped Ondo OUSG RWA sample signals, not jurisdiction-wide legal
conclusions.

Each `Proceed` receipt binds one non-sensitive cross-border scenario reference
to the complete four-jurisdiction evidence snapshot. Clicking a map marker only
changes the reading focus; it does not turn the decision into a single-country
approval or imply a Hold for another jurisdiction.

## Prototype

The current Atlas Canvas prototype lives in [`app/`](./app). It uses a map-first
interface with interactive jurisdiction signals and a human decision rail.

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

## Nova deliverables in progress

- [x] Public-safe project frame and prototype
- [x] Interactive jurisdiction map and human-review flow
- [x] Injective EVM Testnet browser-wallet connection layer
- [x] Locally tested, wallet-bound Proceed receipt contract
- [ ] User-confirmed live test-wallet connection
- [ ] User-confirmed contract deployment and non-value-moving testnet receipt
- [ ] Deployed demo URL
- [ ] Three-minute demo video
- [ ] Pitch deck
