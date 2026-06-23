# LUO Sentinel Design

## Purpose

LUO Sentinel is an independent Injective Nova hackathon project. It turns a
cross-border RWA action request into an evidence-bound compliance preflight,
then lets a human record their decision as a minimal receipt on the Injective
testnet.

The product claim is deliberately narrow: it does not deliver legal advice or
automatically move assets. It makes legal uncertainty visible before an AI
agent or operator takes an on-chain action.

## Scope and boundaries

### In scope

- A focused RWA scenario: an agent proposes a tokenized treasury distribution
  to a new jurisdiction.
- A structured preflight result with source identifiers, jurisdiction-specific
  signals, uncertainty markers, and a recommended disposition.
- A human approval or hold decision.
- A real Injective testnet transaction that records a non-sensitive receipt
  commitment.
- A transaction hash and explorer link shown after confirmation.

### Out of scope

- Legal opinions, automated jurisdiction eligibility, KYC, sanctions screening,
  or token transfers.
- Any mainnet use, real asset movement, private-key handling, seed phrases, or
  background signing.
- Copying private LUO corpora, synthetic traps, internal prompts, or validator
  implementations.
- Modifying either existing LUO repository.

## Product flow

```text
RWA action request
  -> LUO creates an evidence-bound preflight
  -> user sees jurisdictional divergence and uncertainty
  -> user chooses Approve for testnet receipt or Hold for counsel
  -> wallet asks the user to sign a testnet-only transaction
  -> app displays the resulting Injective receipt reference
```

The first demo uses curated, public-safe evidence cards rather than live legal
retrieval. This keeps the proof focused: the app must make the uncertainty and
the human decision legible, then anchor the decision receipt on testnet.

## User experience

The single-page demo has four stages:

1. **Action request** — an agent-style request card describing a tokenized
   treasury distribution and its target jurisdiction.
2. **Evidence preflight** — three to four evidence cards separated by
   jurisdiction and labelled as restrictive, evolving, or unresolved. The
   result is never presented as a legal conclusion.
3. **Human decision** — the operator explicitly selects `Approve testnet
   receipt` or `Hold for counsel`; holding never triggers wallet activity.
4. **Receipt** — after a wallet-confirmed testnet transaction, the UI shows
   the public request commitment, decision, timestamp, network, transaction
   hash, and an explorer link.

The visual direction keeps LUO's evidence-first character: dark, calm, and
atlas-like, with Chinese navigation and concise English evidence anchors.

## Architecture

The app is a small TypeScript web application with four isolated units:

- `preflight` — deterministic scenario data and a pure evaluator that turns a
  request into a displayable preflight result.
- `receipt` — a pure canonicalization and hashing module. It accepts only the
  public request summary, selected decision, preflight version, and timestamp.
- `wallet` — an Injective testnet adapter. It builds the minimal receipt
  transaction and passes it to the user's connected wallet; it never receives
  a private key.
- `ui` — stage-based components that render the preflight and wallet state.

The first implementation will choose the smallest Injective-supported testnet
transaction suitable for a public commitment. The receipt payload must not
include legal source text, personal data, or a legal conclusion. The app stores
only the returned transaction hash in client state for the demo session.

## Error handling

- No wallet: explain that a compatible wallet and testnet funds are required;
  offer the hold path without blocking the demo.
- User rejects signing: preserve the preflight and show `Receipt not recorded`.
- Transaction failure: show the returned error in plain language and do not
  claim a receipt exists.
- Missing or invalid receipt fields: do not construct a transaction.

## Verification

- Unit tests cover deterministic preflight classification, canonical receipt
  data, and input validation.
- Component tests cover approval, hold, rejected signing, and successful hash
  rendering with a fake wallet adapter.
- Manual testnet verification will be done only after the user has obtained
  test INJ and explicitly confirms the wallet-signing action.

## Competition fit

The project aligns with Nova's AI-and-real-application framing by showing an
AI-initiated RWA workflow whose next step is constrained by evidence,
uncertainty, and human authorization. Injective is not a decorative badge: the
human decision is independently verifiable through a testnet receipt.

Official program reference: <https://injective.com/zh/blog/injective-nova-program-cn>
