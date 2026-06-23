# LUO Sentinel

**Evidence-bound compliance preflight for AI-initiated RWA actions on Injective.**

LUO Sentinel makes jurisdictional divergence visible before an AI agent or
operator proceeds with a tokenized-asset action. The demo preserves distinct
signals for the United States, Switzerland, and Hong Kong, then requires a
human decision rather than manufacturing a universal legal conclusion.

## Prototype

The current Atlas Canvas prototype lives in [`app/`](./app). It uses a map-first
interface with interactive jurisdiction signals and a human decision rail.

```bash
cd app
npm install --ignore-scripts
npm run dev
```

## Safety boundary

The prototype does not move assets, make legal determinations, transmit a
private key, create a signature, or send a transaction. An operator can choose
to connect a test-only MetaMask-compatible wallet to Injective EVM Testnet;
the browser wallet keeps control of the account and may be disconnected at any
time. `Prepare testnet receipt` still creates only a local draft. The verified
Injective integration boundary is documented in
[docs/INJECTIVE_INTEGRATION.md](./docs/INJECTIVE_INTEGRATION.md).

## Nova deliverables in progress

- [x] Public-safe project frame and prototype
- [x] Interactive jurisdiction map and human-review flow
- [x] Injective EVM Testnet browser-wallet connection layer
- [ ] User-confirmed live test-wallet connection
- [ ] User-confirmed, non-value-moving testnet receipt
- [ ] Deployed demo URL
- [ ] Three-minute demo video
- [ ] Pitch deck
