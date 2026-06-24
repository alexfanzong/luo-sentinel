# Injective Integration Boundary

## What has been verified

- The Nova program explicitly requires a deployed project that integrates
  Injective mainnet or testnet.
- The public GitHub repository supplied by the program is owned by
  `InjectiveLabs` and documents an Agent SDK for Injective agent identities.
- Its documented `AgentClient` write path requires a raw private key. The
  read-only `AgentReadClient` does not.
- Injective's official EVM documentation supports MetaMask-compatible browser
  wallets on Injective EVM Testnet. The verified public configuration is:
  - Chain ID: `1439` (`0x59f`)
  - RPC: `https://k8s.testnet.json-rpc.injective.network/`
  - Native currency: `INJ`
  - Explorer: `https://testnet.blockscout.injective.network/`

Official sources: [EVM network information](https://docs.injective.network/developers-evm/network-information)
and [Connect with MetaMask](https://docs.injective.network/developers-evm/dapps/connect-with-metamask).

## Safety decision

LUO Sentinel will not place a private key, seed phrase, or signing secret in:

- the browser application;
- a deployed server or environment variable;
- the public repository; or
- an instruction sent to a user.

The current prototype therefore creates a **local testnet receipt draft** only.
It deliberately does not claim that a transaction was sent. A wallet is shown
as connected only after the operator completes the browser-wallet approval.

The local `Proceed` draft uses the same Keccak-256 and ABI-encoding format as
the reviewed contract. It commits to a canonical RWA evidence manifest, product
reference, connected wallet, decision timestamp, and a one-time nonce. It
contains no source text, private key, email address, or legal conclusion. It
is shown as `local only` until a separately reviewed and user-confirmed testnet
action records it.

## Local contract, not yet deployed

The repository now contains a locally tested `LUOReceiptAnchor` contract for a
future `Proceed` receipt. It binds the receipt hash to the submitting wallet,
uses no value transfer, and keeps `Hold for counsel` off-chain. Its exact
privacy and verification boundary is documented in
[ONCHAIN_RECEIPT_SPEC.md](./ONCHAIN_RECEIPT_SPEC.md).

The browser-side Keccak evidence-manifest implementation uses reviewed, pinned
dependencies: `ethers` `6.17.0` for ABI-compatible hashing and `canonicalize`
`3.0.0` for JSON Canonicalization Scheme serialization. The app can separately
prepare a contract-deployment or `anchorProceed` transaction preview, estimate
its fee from the connected testnet wallet, and request the browser wallet to
submit it only after an explicit confirmation click. The preview enforces zero
value transfer and Injective EVM Testnet (`1439`) before it can open the wallet.
No contract has been deployed, and no test INJ has been spent.

## Implemented browser-wallet connection

`app/src/lib/injectiveEvm.js` provides a small, dependency-free connection
adapter. It runs only after the operator clicks `Injective Testnet · connect
wallet` and then:

1. asks the browser wallet to make an account available;
2. switches to Injective EVM Testnet; and
3. offers to add that testnet only if the wallet reports that the chain is
   unknown.

This operation never asks for a seed phrase or private key, never creates a
signature, and never sends a transaction. A live wallet connection still needs
to be performed by the operator in their own browser using a test-only wallet.

## Integration gate

Before an Injective package is added, verify all three items from official
sources:

1. The exact npm package name and publisher match the official repository.
2. A browser-wallet testnet path can prepare and request a user-side signature
   without exposing a private key to the app.
3. The selected testnet message is non-value-moving and contains only a public
   receipt commitment.

Those conditions are implemented in the browser-only testnet path. The next
live action still requires the operator to review the displayed destination,
`0 INJ` transfer value, and fresh estimated fee, then explicitly confirm the
transaction inside their own wallet. The app shows the resulting transaction
hash and explorer link only after the wallet returns it.
