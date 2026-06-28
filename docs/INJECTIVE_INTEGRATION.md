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
- A user-confirmed, zero-value testnet contract interaction has been recorded:
  `0x17ae3d575955edb1c2e8d608641fb36d03a5c456dcacf0ca245bc0f9ed34c2eb`.
  Read-only RPC verification returned `status: 0x1`, `value: 0x0`,
  chain ID `0x59f`, and target
  `0xc7AE2D5e83d5Fc3fC05e618E60807E05D5E57e15`.

Official sources: [EVM network information](https://docs.injective.network/developers-evm/network-information)
and [Connect with MetaMask](https://docs.injective.network/developers-evm/dapps/connect-with-metamask).

## Safety decision

LUO Sentinel will not place a private key, seed phrase, or signing secret in:

- the browser application;
- a deployed server or environment variable;
- the public repository; or
- an instruction sent to a user.

The prototype creates a **local testnet receipt draft** first. A wallet is shown
as connected only after the operator completes the browser-wallet approval. A
separate review step is required before any testnet transaction can be sent.

The local `Proceed` draft uses the same Keccak-256 and ABI-encoding format as
the reviewed contract. It commits to a canonical RWA evidence manifest, product
reference, connected wallet, decision timestamp, and a one-time nonce. It
contains no source text, private key, email address, or legal conclusion. It
is shown as `local only` until a separately reviewed and user-confirmed testnet
action records it.

## Receipt-anchor contract and live receipt

The repository contains a locally tested `LUOReceiptAnchor` contract for a
`Proceed` receipt. It binds the receipt hash to the submitting wallet, uses no
value transfer, and keeps `Hold for counsel` off-chain. The public boundary is
intentionally narrow: the receipt proves that a wallet accepted a bounded,
reviewed Sentinel decision; it does not prove legal compliance, create a legal
opinion, or authorize an asset transaction. The current demo uses the verified
testnet receipt-anchor contract at
`0xc7AE2D5e83d5Fc3fC05e618E60807E05D5E57e15`.

The browser-side Keccak evidence-manifest implementation uses reviewed, pinned
dependencies: `ethers` `6.17.0` for ABI-compatible hashing and `canonicalize`
`3.0.0` for JSON Canonicalization Scheme serialization. The app can separately
prepare a contract-deployment or `anchorProceed` transaction preview, estimate
its fee from the connected testnet wallet, and request the browser wallet to
submit it only after an explicit confirmation click. The preview enforces zero
value transfer and Injective EVM Testnet (`1439`) before it can open the wallet.
After a deployment is mined, the app reads the deployed runtime bytecode and
compares its Keccak-256 hash with the reviewed local Forge artifact. A mismatch
is visibly marked as unverified and cannot be used for receipt anchoring.
The live receipt interaction transfers `0 INJ`; the user still pays normal
testnet gas for the contract call.

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
transaction inside their own wallet. After a transaction is broadcast, the app
confirms its receipt through Injective's public testnet RPC rather than relying
on the browser wallet's receipt waiter. This keeps the UI tied to the chain's
actual status if a wallet or explorer display is stale. A previously deployed
receipt-anchor address can also be re-verified through the same read-only path.
