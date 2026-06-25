# LUO Sentinel — On-chain Proceed Receipt v1

## Purpose

The receipt is an auditable commitment that a wallet explicitly chose to
proceed after viewing a reviewed RWA evidence snapshot. It is **not** a legal
opinion, a proof that a person cognitively reviewed the evidence, an RWA
issuance, or an asset transfer.

`Hold for counsel` remains a local action and never spends gas. Only an
explicit `Proceed` may be anchored.

## Privacy boundary

The chain stores only:

- the evidence-set hash;
- the product-reference hash;
- the submitting wallet address;
- a decision timestamp and block timestamp; and
- the resulting receipt hash.

It stores no source text, source URLs, legal analysis, email address, or other
cleartext reviewer identity. A plain hash of an email address is not used as an
identity system because it can be guessable and is not bound to wallet control.

## Receipt format

The Solidity contract is the canonical definition:

```text
SCHEMA_VERSION_HASH = keccak256("LUO_SENTINEL_PROCEED_RECEIPT_V1")

receiptHash = keccak256(abi.encode(
  SCHEMA_VERSION_HASH,
  evidenceHash,
  productRefHash,
  reviewerWallet,
  decidedAt,
  nonce
))
```

`reviewerWallet` must equal `msg.sender`. The contract calculates this hash
itself; callers cannot submit an unrelated hash.

`evidenceHash` is derived from a canonical, off-chain evidence manifest
containing the reviewed RWA source anchors. The browser now prepares the same
receipt format locally, using JSON Canonicalization Scheme serialization and
Keccak-256. It remains labelled `local only` because preparing a hash is not a
transaction and does not demonstrate an on-chain record.

For this demo, the evidence manifest contains the full reviewed scope — United
States, Hong Kong, Singapore, and European Union — plus one non-sensitive
`caseRef` such as `RWA-DEMO-001`. The marker selected in the Atlas UI is a
reading focus only. It does not make a single-jurisdiction decision, and a
jurisdiction outside a future scope must never be inferred to be a `Hold`.

The browser implementation uses reviewed, pinned dependencies: `canonicalize`
`3.0.0` for canonical JSON and `ethers` `6.17.0` for Ethereum-compatible
Keccak hashing and ABI encoding. The lockfile records their exact resolved
versions.

When preparing a browser draft, LUO Sentinel sets `decidedAt` to one minute
before the local clock. This small buffer avoids a harmless testnet block-time
lag being mistaken for a future decision by the contract; the one-hour expiry
still applies.

## Contract invariants

- no value is transferred;
- only a `Proceed` receipt can be anchored;
- a decision time cannot be in the future;
- a decision expires after one hour;
- a receipt hash cannot be overwritten; and
- another wallet produces a different receipt hash, even with the same other
  inputs, so it cannot occupy the reviewer's receipt by front-running.

## Verification

1. Obtain the off-chain evidence manifest and recompute `evidenceHash`.
2. Recompute `productRefHash` and `receiptHash` using the reviewer wallet.
3. Query `getRecord(receiptHash)`.
4. Verify the stored evidence hash, product hash, wallet, decision time, and
   block time match the reviewed payload.

The result proves that the wallet anchored this specific commitment at the
recorded block time. It does not prove legal compliance or independently prove
who controlled the wallet.

## Testnet proof boundary

`contracts/LUOReceiptAnchor.sol` has passed local Foundry tests. The current
demo uses a verified Injective EVM Testnet receipt-anchor contract at
`0xc7AE2D5e83d5Fc3fC05e618E60807E05D5E57e15`.

The browser implementation enforces two separate steps: review first, then a
separate wallet-confirmation click. It cannot submit a transaction during
receipt preparation. The user-confirmed testnet interaction below records a
non-value-moving contract call:

- Transaction:
  `0x17ae3d575955edb1c2e8d608641fb36d03a5c456dcacf0ca245bc0f9ed34c2eb`
- Explorer:
  `https://testnet.blockscout.injective.network/tx/0x17ae3d575955edb1c2e8d608641fb36d03a5c456dcacf0ca245bc0f9ed34c2eb`
- RPC receipt status: `0x1`
- Transaction value: `0x0`
- Chain ID: `0x59f`

This proves that the wallet completed a zero-value receipt-anchor interaction
on Injective EVM Testnet. It does not prove legal compliance or authorize an
asset action.
