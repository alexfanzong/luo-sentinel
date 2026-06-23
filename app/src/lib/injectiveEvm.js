export const INJECTIVE_EVM_TESTNET = Object.freeze({
  chainId: 1439,
  chainIdHex: "0x59f",
  chainName: "Injective EVM Testnet",
  nativeCurrency: {
    name: "Injective",
    symbol: "INJ",
    decimals: 18,
  },
  rpcUrl: "https://k8s.testnet.json-rpc.injective.network/",
  blockExplorerUrl: "https://testnet.blockscout.injective.network/",
});

export async function connectToInjectiveEvmTestnet(provider) {
  if (!provider?.request) {
    throw new Error("Compatible browser wallet not found.");
  }

  const accounts = await provider.request({ method: "eth_requestAccounts" });
  const address = accounts?.[0];

  if (!address) {
    throw new Error("No wallet account was made available.");
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: INJECTIVE_EVM_TESTNET.chainIdHex }],
    });
  } catch (error) {
    if (error?.code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: INJECTIVE_EVM_TESTNET.chainIdHex,
        chainName: INJECTIVE_EVM_TESTNET.chainName,
        nativeCurrency: INJECTIVE_EVM_TESTNET.nativeCurrency,
        rpcUrls: [INJECTIVE_EVM_TESTNET.rpcUrl],
        blockExplorerUrls: [INJECTIVE_EVM_TESTNET.blockExplorerUrl],
      }],
    });
  }

  return { address, chainId: INJECTIVE_EVM_TESTNET.chainId };
}
