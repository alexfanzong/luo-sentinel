import assert from "node:assert/strict";
import test from "node:test";
import { getCreateAddress, Interface } from "ethers";

import { createProceedReceiptDraft } from "./onchainReceipt.js";
import {
  createAnchorProceedTransactionPreview,
  createDeploymentTransactionPreview,
  estimateTestnetTransaction,
  readAnchoredReceipt,
  submitConfirmedTestnetTransaction,
} from "./receiptAnchorClient.js";
import * as receiptAnchorClient from "./receiptAnchorClient.js";

const REVIEWER = "0x00000000000000000000000000000000000A11cE";
const CONTRACT = "0x000000000000000000000000000000000000c0de";
const RECEIPT = createProceedReceiptDraft({
  reviewerWallet: REVIEWER,
  decidedAt: 1782086940,
  nonce: "0x000000000000000000000000000000000000000000000000000000000000002a",
  caseRef: "RWA-DEMO-001",
});

test("creates an Injective deployment preview with 0 INJ transfer value without prompting a wallet", () => {
  const preview = createDeploymentTransactionPreview();

  assert.equal(preview.kind, "contract-deployment");
  assert.equal(preview.chainId, 1439);
  assert.equal(preview.to, null);
  assert.equal(preview.value, 0n);
  assert.match(preview.data, /^0x[0-9a-f]+$/i);
  assert.ok(preview.data.length > 1000);
});

test("encodes a no-asset-transfer anchorProceed call without legal source text", () => {
  const preview = createAnchorProceedTransactionPreview({
    contractAddress: CONTRACT,
    receipt: RECEIPT,
  });

  assert.equal(preview.kind, "proceed-receipt");
  assert.equal(preview.chainId, 1439);
  assert.equal(preview.to, "0x000000000000000000000000000000000000c0DE");
  assert.equal(preview.value, 0n);
  assert.match(preview.data, /^0x[0-9a-f]+$/i);
  assert.ok(preview.data.length > 100);
  assert.doesNotMatch(preview.data, /United States|Hong Kong|Singapore|European Union/i);
});

test("refuses to create a write preview for an invalid contract address", () => {
  assert.throws(
    () => createAnchorProceedTransactionPreview({ contractAddress: "not-an-address", receipt: RECEIPT }),
    /contract address/i,
  );
});

test("estimates a 0 INJ transfer-value transaction only on Injective EVM Testnet", async () => {
  const estimate = await estimateTestnetTransaction({
    preview: createDeploymentTransactionPreview(),
    walletAddress: REVIEWER,
    provider: {
      getNetwork: async () => ({ chainId: 1439n }),
      estimateGas: async (request) => {
        assert.equal(request.value, 0n);
        assert.equal(request.to, undefined);
        return 629164n;
      },
      getFeeData: async () => ({ gasPrice: 160000000n, maxFeePerGas: null }),
    },
  });

  assert.equal(estimate.gasLimit, 629164n);
  assert.equal(estimate.gasPrice, 160000000n);
  assert.equal(estimate.maxFeeWei, 100666240000000n);
});

test("prefers EIP-1559 maxFeePerGas over legacy gasPrice when both are available", async () => {
  const estimate = await estimateTestnetTransaction({
    preview: createDeploymentTransactionPreview(),
    walletAddress: REVIEWER,
    provider: {
      getNetwork: async () => ({ chainId: 1439n }),
      estimateGas: async () => 10n,
      getFeeData: async () => ({ gasPrice: 100n, maxFeePerGas: 250n }),
    },
  });

  assert.equal(estimate.gasPrice, 250n);
  assert.equal(estimate.maxFeeWei, 2500n);
});

test("refuses to estimate a transaction on the wrong network", async () => {
  await assert.rejects(
    () => estimateTestnetTransaction({
      preview: createDeploymentTransactionPreview(),
      walletAddress: REVIEWER,
      provider: {
        getNetwork: async () => ({ chainId: 1n }),
        estimateGas: async () => 1n,
        getFeeData: async () => ({ gasPrice: 1n }),
      },
    }),
    /Injective EVM Testnet/i,
  );
});

test("will not send a transaction without an explicit confirmation flag", async () => {
  let signerRequested = false;

  await assert.rejects(
    () => submitConfirmedTestnetTransaction({
      preview: createDeploymentTransactionPreview(),
      walletAddress: REVIEWER,
      provider: {
        getNetwork: async () => ({ chainId: 1439n }),
        getSigner: async () => {
          signerRequested = true;
          return { sendTransaction: async () => ({ hash: "0xignored" }) };
        },
      },
    }),
    /explicit confirmation/i,
  );

  assert.equal(signerRequested, false);
});

test("confirms a deployment from code at its deterministic create address without reading a receipt", async () => {
  assert.equal(typeof receiptAnchorClient.waitForDeployedContract, "function");

  const expectedAddress = getCreateAddress({ from: REVIEWER, nonce: 0 });
  const deployed = await receiptAnchorClient.waitForDeployedContract({
    deployer: REVIEWER,
    nonce: 0,
    attempts: 1,
    pollIntervalMs: 0,
    provider: {
      getCode: async (address) => {
        assert.equal(address, expectedAddress);
        return "0x6000";
      },
      getTransactionReceipt: async () => {
        throw new Error("receipt polling must not be used to confirm deployment");
      },
    },
  });

  assert.equal(deployed, expectedAddress);
});

test("reports deployment polling progress before code appears", async () => {
  const progress = [];
  const expectedAddress = getCreateAddress({ from: REVIEWER, nonce: 0 });
  const deployed = await receiptAnchorClient.waitForDeployedContract({
    deployer: REVIEWER,
    nonce: 0,
    attempts: 2,
    pollIntervalMs: 0,
    onAttempt: (state) => progress.push(state),
    provider: {
      getCode: async () => (progress.length === 1 ? "0x" : "0x6000"),
    },
  });

  assert.equal(deployed, expectedAddress);
  assert.deepEqual(progress.map((state) => state.attempt), [1, 2]);
  assert.deepEqual(progress.map((state) => state.attempts), [2, 2]);
  assert.equal(progress[0].contractAddress, expectedAddress);
});

test("confirms an anchored receipt from contract state without reading a transaction receipt", async () => {
  assert.equal(typeof receiptAnchorClient.waitForAnchoredReceipt, "function");

  const contractInterface = new Interface([
    "function getRecord(bytes32 receiptHash) view returns (address submitter, uint64 anchoredAt, uint64 decidedAt, bytes32 evidenceHash, bytes32 productRefHash)",
  ]);
  const returnedRecord = contractInterface.encodeFunctionResult("getRecord", [
    REVIEWER,
    1782087060n,
    BigInt(RECEIPT.decidedAt),
    RECEIPT.evidenceHash,
    RECEIPT.productRefHash,
  ]);

  const record = await receiptAnchorClient.waitForAnchoredReceipt({
    contractAddress: CONTRACT,
    receiptHash: RECEIPT.receiptHash,
    attempts: 1,
    pollIntervalMs: 0,
    provider: {
      call: async () => returnedRecord,
      getTransactionReceipt: async () => {
        throw new Error("receipt polling must not be used to confirm anchoring");
      },
    },
  });

  assert.equal(record.submitter, REVIEWER);
  assert.equal(record.evidenceHash, RECEIPT.evidenceHash);
});

test("rejects an anchored record that does not match the expected receipt fields", async () => {
  const contractInterface = new Interface([
    "function getRecord(bytes32 receiptHash) view returns (address submitter, uint64 anchoredAt, uint64 decidedAt, bytes32 evidenceHash, bytes32 productRefHash)",
  ]);
  const returnedRecord = contractInterface.encodeFunctionResult("getRecord", [
    REVIEWER,
    1782087060n,
    BigInt(RECEIPT.decidedAt + 1),
    RECEIPT.evidenceHash,
    RECEIPT.productRefHash,
  ]);

  await assert.rejects(
    () => receiptAnchorClient.waitForAnchoredReceipt({
      contractAddress: CONTRACT,
      receiptHash: RECEIPT.receiptHash,
      expectedReceipt: RECEIPT,
      attempts: 1,
      pollIntervalMs: 0,
      provider: {
        call: async () => returnedRecord,
      },
    }),
    /does not match the reviewed receipt/i,
  );
});

test("reads and decodes an anchored receipt after its transaction is mined", async () => {
  const contractInterface = new Interface([
    "function getRecord(bytes32 receiptHash) view returns (address submitter, uint64 anchoredAt, uint64 decidedAt, bytes32 evidenceHash, bytes32 productRefHash)",
  ]);
  const returnedRecord = contractInterface.encodeFunctionResult("getRecord", [
    REVIEWER,
    1782087060n,
    BigInt(RECEIPT.decidedAt),
    RECEIPT.evidenceHash,
    RECEIPT.productRefHash,
  ]);

  const record = await readAnchoredReceipt({
    contractAddress: CONTRACT,
    receiptHash: RECEIPT.receiptHash,
    provider: {
      call: async (request) => {
        assert.equal(request.to, "0x000000000000000000000000000000000000c0DE");
        assert.match(request.data, /^0x213681cd/);
        return returnedRecord;
      },
    },
  });

  assert.deepEqual(record, {
    submitter: REVIEWER,
    anchoredAt: 1782087060,
    decidedAt: RECEIPT.decidedAt,
    evidenceHash: RECEIPT.evidenceHash,
    productRefHash: RECEIPT.productRefHash,
  });
});
