import assert from "node:assert/strict";
import test from "node:test";

import {
  INJECTIVE_EVM_TESTNET,
  connectToInjectiveEvmTestnet,
} from "./injectiveEvm.js";

test("connects an injected wallet and switches it to Injective EVM Testnet", async () => {
  const calls = [];
  const provider = {
    async request(request) {
      calls.push(request);

      if (request.method === "eth_requestAccounts") {
        return ["0xA11CE"];
      }

      return null;
    },
  };

  const result = await connectToInjectiveEvmTestnet(provider);

  assert.deepEqual(result, { address: "0xA11CE", chainId: INJECTIVE_EVM_TESTNET.chainId });
  assert.deepEqual(calls, [
    { method: "eth_requestAccounts" },
    {
      method: "wallet_switchEthereumChain",
      params: [{ chainId: INJECTIVE_EVM_TESTNET.chainIdHex }],
    },
  ]);
});

test("adds Injective EVM Testnet only when the wallet reports an unknown chain", async () => {
  const calls = [];
  const provider = {
    async request(request) {
      calls.push(request);

      if (request.method === "eth_requestAccounts") {
        return ["0xA11CE"];
      }

      if (request.method === "wallet_switchEthereumChain") {
        const error = new Error("Unknown chain");
        error.code = 4902;
        throw error;
      }

      return null;
    },
  };

  await connectToInjectiveEvmTestnet(provider);

  assert.deepEqual(calls[2], {
    method: "wallet_addEthereumChain",
    params: [{
      chainId: INJECTIVE_EVM_TESTNET.chainIdHex,
      chainName: INJECTIVE_EVM_TESTNET.chainName,
      nativeCurrency: INJECTIVE_EVM_TESTNET.nativeCurrency,
      rpcUrls: [INJECTIVE_EVM_TESTNET.rpcUrl],
      blockExplorerUrls: [INJECTIVE_EVM_TESTNET.blockExplorerUrl],
    }],
  });
});

test("does not attempt a wallet request when no injected provider exists", async () => {
  await assert.rejects(
    () => connectToInjectiveEvmTestnet(null),
    /Compatible browser wallet not found/,
  );
});
