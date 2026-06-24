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

## Deployment boundary

`contracts/LUOReceiptAnchor.sol` has only passed local Foundry tests. It has
not been deployed to Injective EVM Testnet. Deployment and any later
`anchorProceed` call require a fresh gas estimate, a visible transaction
preview, and the operator's explicit confirmation at that time. The browser
implementation enforces this in two separate steps: review first, then a
separate wallet-confirmation click. It cannot submit a transaction during
receipt preparation.
