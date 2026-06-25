import { getAddress, getCreateAddress, Interface, isHexString, keccak256 } from "ethers";

import { INJECTIVE_EVM_TESTNET } from "./injectiveEvm.js";

const RECEIPT_ANCHOR_ABI = [
  "function anchorProceed(bytes32 evidenceHash, bytes32 productRefHash, uint64 decidedAt, bytes32 nonce) returns (bytes32)",
  "function getRecord(bytes32 receiptHash) view returns (address submitter, uint64 anchoredAt, uint64 decidedAt, bytes32 evidenceHash, bytes32 productRefHash)",
];

// Generated locally from contracts/LUOReceiptAnchor.sol with Forge 1.5.1 and
// Solidity 0.8.33. This bytecode is intentionally committed so a browser
// wallet can show the exact contract-creation transaction before submission.
const RECEIPT_ANCHOR_BYTECODE = "0x6080604052348015600e575f5ffd5b50610a718061001c5f395ff3fe608060405234801561000f575f5ffd5b5060043610610060575f3560e01c8063213681cd1461006457806326e9cef71461009857806337f73f5e146100c85780633ad254f0146100f85780634f0b580114610116578063d5c1810d14610146575b5f5ffd5b61007e600480360381019061007991906106be565b610164565b60405161008f959493929190610759565b60405180910390f35b6100b260048036038101906100ad91906107fe565b61027f565b6040516100bf9190610875565b60405180910390f35b6100e260048036038101906100dd919061088e565b6102dc565b6040516100ef9190610875565b60405180910390f35b6101006105f4565b60405161010d91906108f2565b60405180910390f35b610130600480360381019061012b91906106be565b6105fa565b60405161013d9190610925565b60405180910390f35b61014e610663565b60405161015b9190610875565b60405180910390f35b5f5f5f5f5f5f5f5f8881526020019081526020015f2090505f73ffffffffffffffffffffffffffffffffffffffff16815f015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff160361020e57866040517f48fa6aac0000000000000000000000000000000000000000000000000000000081526004016102059190610875565b60405180910390fd5b805f015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16815f0160149054906101000a900467ffffffffffffffff16826001015f9054906101000a900467ffffffffffffffff1683600201548460030154955095509550955095505091939590929450565b5f7f072444602024388cc72784df00cb844cbb6b4f399031d1758a29b04d6f75c2a386868686866040516020016102bb9695949392919061093e565b60405160208183030381529060405280519060200120905095945050505050565b5f5f5f1b8514806102ee57505f5f1b84145b806102fa57505f5f1b82145b15610331576040517f7c946ed700000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b428367ffffffffffffffff161115610375576040517f9cfc06fc00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b610e1067ffffffffffffffff168367ffffffffffffffff164261039891906109d3565b11156103d0576040517fb89a740a00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6103dd858533868661027f565b90505f73ffffffffffffffffffffffffffffffffffffffff165f5f8381526020019081526020015f205f015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461048057806040517f30d238130000000000000000000000000000000000000000000000000000000081526004016104779190610875565b60405180910390fd5b6040518060a001604052803373ffffffffffffffffffffffffffffffffffffffff1681526020014267ffffffffffffffff1681526020018467ffffffffffffffff168152602001868152602001858152505f5f8381526020019081526020015f205f820151815f015f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506020820151815f0160146101000a81548167ffffffffffffffff021916908367ffffffffffffffff1602179055506040820151816001015f6101000a81548167ffffffffffffffff021916908367ffffffffffffffff1602179055506060820151816002015560808201518160030155905050843373ffffffffffffffffffffffffffffffffffffffff16827f328ceb498755d11394ce72cf9be149dc024d40a9105e3a79f51105d4c24a61788787426040516105e493929190610a06565b60405180910390a4949350505050565b610e1081565b5f5f73ffffffffffffffffffffffffffffffffffffffff165f5f8481526020019081526020015f205f015f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614159050919050565b7f072444602024388cc72784df00cb844cbb6b4f399031d1758a29b04d6f75c2a381565b5f5ffd5b5f819050919050565b61069d8161068b565b81146106a7575f5ffd5b50565b5f813590506106b881610694565b92915050565b5f602082840312156106d3576106d2610687565b5b5f6106e0848285016106aa565b91505092915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610712826106e9565b9050919050565b61072281610708565b82525050565b5f67ffffffffffffffff82169050919050565b61074481610728565b82525050565b6107538161068b565b82525050565b5f60a08201905061076c5f830188610719565b610779602083018761073b565b610786604083018661073b565b610793606083018561074a565b6107a0608083018461074a565b9695505050505050565b6107b381610708565b81146107bd575f5ffd5b50565b5f813590506107ce816107aa565b92915050565b6107dd81610728565b81146107e7575f5ffd5b50565b5f813590506107f8816107d4565b92915050565b5f5f5f5f5f60a0868803121561081757610816610687565b5b5f610824888289016106aa565b9550506020610835888289016106aa565b9450506040610846888289016107c0565b9350506060610857888289016107ea565b9250506080610868888289016106aa565b9150509295509295909350565b5f6020820190506108885f83018461074a565b92915050565b5f5f5f5f608085870312156108a6576108a5610687565b5b5f6108b3878288016106aa565b94505060206108c4878288016106aa565b93505060406108d5878288016107ea565b92505060606108e6878288016106aa565b91505092959194509250565b5f6020820190506109055f83018461073b565b92915050565b5f8115159050919050565b61091f8161090b565b82525050565b5f6020820190506109385f830184610916565b92915050565b5f60c0820190506109515f83018961074a565b61095e602083018861074a565b61096b604083018761074a565b6109786060830186610719565b610985608083018561073b565b61099260a083018461074a565b979650505050505050565b5f819050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f6109dd8261099d565b91506109e88361099d565b9250828203905081811115610a00576109ff6109a6565b5b92915050565b5f606082019050610a195f83018661074a565b610a26602083018561073b565b610a33604083018461073b565b94935050505056fea26469706673582212209d1146bde32f7f4ecfa142f35f5c5037b2e034b0ac6081cf6d689a1c49fa9ce764736f6c63430008210033";

export const EXPECTED_RECEIPT_ANCHOR_RUNTIME_HASH = "0x529e4b44837fbcd0a5d3d02583aa30ccbf914ed4df6e179b6f963383676d20db";

const anchorInterface = new Interface(RECEIPT_ANCHOR_ABI);

function injectivePreview(fields) {
  return {
    chainId: INJECTIVE_EVM_TESTNET.chainId,
    networkName: INJECTIVE_EVM_TESTNET.chainName,
    value: 0n,
    ...fields,
  };
}

function normalizeWalletAddress(walletAddress) {
  try {
    return getAddress(walletAddress);
  } catch {
    throw new Error("A valid connected wallet address is required.");
  }
}

function toTransactionRequest(preview, walletAddress) {
  if (!preview || preview.chainId !== INJECTIVE_EVM_TESTNET.chainId) {
    throw new Error("The transaction preview is not for Injective EVM Testnet.");
  }
  if (preview.value !== 0n) {
    throw new Error("LUO Sentinel only permits zero-value testnet transactions.");
  }
  if (typeof preview.data !== "string" || !/^0x[0-9a-f]+$/i.test(preview.data)) {
    throw new Error("The transaction preview has invalid calldata.");
  }

  const from = normalizeWalletAddress(walletAddress);
  const to = preview.to === null ? undefined : getAddress(preview.to);
  return { from, to, data: preview.data, value: preview.value };
}

async function assertInjectiveTestnet(provider) {
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(INJECTIVE_EVM_TESTNET.chainId)) {
    throw new Error("Switch the wallet to Injective EVM Testnet before continuing.");
  }
}

export function createDeploymentTransactionPreview() {
  return injectivePreview({
    kind: "contract-deployment",
    label: "Deploy LUO receipt anchor",
    to: null,
    data: RECEIPT_ANCHOR_BYTECODE,
  });
}

export function createAnchorProceedTransactionPreview({ contractAddress, receipt }) {
  let normalizedContract;
  try {
    normalizedContract = getAddress(contractAddress);
  } catch {
    throw new Error("A valid receipt-anchor contract address is required.");
  }

  if (!receipt?.evidenceHash || !receipt?.productRefHash || !receipt?.nonce || !receipt?.decidedAt) {
    throw new Error("A complete Proceed receipt is required.");
  }

  return injectivePreview({
    kind: "proceed-receipt",
    label: "Anchor Proceed receipt",
    to: normalizedContract,
    data: anchorInterface.encodeFunctionData("anchorProceed", [
      receipt.evidenceHash,
      receipt.productRefHash,
      receipt.decidedAt,
      receipt.nonce,
    ]),
  });
}

export async function estimateTestnetTransaction({ provider, walletAddress, preview }) {
  const request = toTransactionRequest(preview, walletAddress);
  await assertInjectiveTestnet(provider);

  const [gasLimit, feeData] = await Promise.all([
    provider.estimateGas(request),
    provider.getFeeData(),
  ]);
  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? null;

  return {
    ...preview,
    gasLimit,
    gasPrice,
    maxFeeWei: gasPrice === null ? null : gasLimit * gasPrice,
  };
}

export async function submitConfirmedTestnetTransaction({
  provider,
  walletAddress,
  preview,
  gasLimit,
  operatorConfirmed = false,
}) {
  if (operatorConfirmed !== true) {
    throw new Error("An explicit confirmation is required before opening the wallet.");
  }

  const request = toTransactionRequest(preview, walletAddress);
  await assertInjectiveTestnet(provider);

  const signer = await provider.getSigner(request.from);
  return signer.sendTransaction({
    to: request.to,
    data: request.data,
    value: request.value,
    ...(gasLimit ? { gasLimit } : {}),
  });
}

function wait(pollIntervalMs) {
  return new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
}

// Injective EVM Testnet can expose a transaction-hash / receipt mismatch to
// wallets. Contract code appearing at the CREATE address is the authoritative
// deployment signal, so receipt polling is deliberately not used here.
export async function waitForDeployedContract({
  provider,
  deployer,
  nonce,
  attempts = 30,
  pollIntervalMs = 1000,
  onAttempt,
}) {
  let normalizedDeployer;
  try {
    normalizedDeployer = getAddress(deployer);
  } catch {
    throw new Error("A valid deployer wallet address is required.");
  }
  if (!Number.isSafeInteger(nonce) || nonce < 0) {
    throw new Error("A valid deployment nonce is required.");
  }

  const contractAddress = getCreateAddress({ from: normalizedDeployer, nonce });
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    onAttempt?.({ attempt: attempt + 1, attempts, contractAddress });
    const code = await provider.getCode(contractAddress);
    if (isHexString(code) && code.length > 2) return contractAddress;
    if (attempt + 1 < attempts) await wait(pollIntervalMs);
  }

  throw new Error("Deployment not visible on-chain yet. Check the explorer, then paste the contract address to continue.");
}

export async function verifyDeployedRuntimeBytecode({ provider, contractAddress }) {
  let normalizedContract;
  try {
    normalizedContract = getAddress(contractAddress);
  } catch {
    throw new Error("A valid deployed receipt-anchor contract address is required.");
  }

  const runtimeBytecode = await provider.getCode(normalizedContract);
  if (!isHexString(runtimeBytecode) || runtimeBytecode.length <= 2) {
    throw new Error("No deployed runtime bytecode was found at the receipt-anchor address.");
  }

  const runtimeHash = keccak256(runtimeBytecode);
  if (runtimeHash.toLowerCase() !== EXPECTED_RECEIPT_ANCHOR_RUNTIME_HASH) {
    throw new Error("Deployed runtime bytecode does not match the reviewed receipt-anchor runtime.");
  }

  return {
    contractAddress: normalizedContract,
    runtimeHash,
    expectedRuntimeHash: EXPECTED_RECEIPT_ANCHOR_RUNTIME_HASH,
  };
}

export async function readAnchoredReceipt({ provider, contractAddress, receiptHash }) {
  let normalizedContract;
  try {
    normalizedContract = getAddress(contractAddress);
  } catch {
    throw new Error("A valid receipt-anchor contract address is required.");
  }
  if (!isHexString(receiptHash, 32)) {
    throw new Error("A valid receipt hash is required.");
  }

  const data = anchorInterface.encodeFunctionData("getRecord", [receiptHash]);
  const result = anchorInterface.decodeFunctionResult(
    "getRecord",
    await provider.call({ to: normalizedContract, data }),
  );

  return {
    submitter: getAddress(result.submitter),
    anchoredAt: Number(result.anchoredAt),
    decidedAt: Number(result.decidedAt),
    evidenceHash: result.evidenceHash,
    productRefHash: result.productRefHash,
  };
}

// A successful getRecord call is the authoritative anchor signal. The
// transaction hash remains useful for an explorer link, but is not a success
// criterion on this testnet.
export async function waitForAnchoredReceipt({
  provider,
  contractAddress,
  receiptHash,
  expectedReceipt,
  attempts = 30,
  pollIntervalMs = 1000,
}) {
  try {
    getAddress(contractAddress);
  } catch {
    throw new Error("A valid receipt-anchor contract address is required.");
  }
  if (!isHexString(receiptHash, 32)) {
    throw new Error("A valid receipt hash is required.");
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const record = await readAnchoredReceipt({ provider, contractAddress, receiptHash });
      if (
        expectedReceipt
        && (
          record.evidenceHash !== expectedReceipt.evidenceHash
          || record.productRefHash !== expectedReceipt.productRefHash
          || record.decidedAt !== expectedReceipt.decidedAt
        )
      ) {
        throw new Error("The confirmed record does not match the reviewed receipt.");
      }
      return record;
    } catch (error) {
      if (/does not match the reviewed receipt/i.test(error?.message || "")) throw error;
      if (attempt + 1 >= attempts) break;
      await wait(pollIntervalMs);
    }
  }

  throw new Error("Receipt not yet confirmed on-chain. Check the explorer before retrying.");
}
