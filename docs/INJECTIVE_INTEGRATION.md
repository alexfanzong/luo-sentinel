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

The current prototype therefore uses a **local testnet receipt draft** only.
It deliberately does not claim that a transaction was sent. A wallet is shown
as connected only after the operator completes the browser-wallet approval.

Each local draft now generates a SHA-256 public commitment over the receipt
version, decision label, reviewed RWA source anchor, and timestamp. It contains
no source text, wallet address, private data, or legal conclusion. It is shown
as `local only` until a separately reviewed and user-confirmed testnet action
records it.

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

When those conditions are met, replace the `Prepare testnet receipt` local
draft with a user-confirmed browser-wallet action and show the returned
transaction hash plus explorer link. Before that change, the exact message,
destination, fee, and whether it moves any value must be shown to the operator
and explicitly approved.
