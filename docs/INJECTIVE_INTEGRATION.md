# Injective Integration Boundary

## What has been verified

- The Nova program explicitly requires a deployed project that integrates
  Injective mainnet or testnet.
- The public GitHub repository supplied by the program is owned by
  `InjectiveLabs` and documents an Agent SDK for Injective agent identities.
- Its documented `AgentClient` write path requires a raw private key. The
  read-only `AgentReadClient` does not.

## Safety decision

LUO Sentinel will not place a private key, seed phrase, or signing secret in:

- the browser application;
- a deployed server or environment variable;
- the public repository; or
- an instruction sent to a user.

The current prototype therefore uses a **local testnet receipt draft** only.
It deliberately does not claim that a transaction was sent or that a wallet is
connected.

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
transaction hash plus explorer link.
