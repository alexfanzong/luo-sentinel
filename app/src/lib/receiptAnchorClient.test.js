import assert from "node:assert/strict";
import test from "node:test";
import { Interface } from "ethers";

import { createProceedReceiptDraft } from "./onchainReceipt.js";
import {
  createAnchorProceedTransactionPreview,
  createDeploymentTransactionPreview,
  estimateTestnetTransaction,
  readAnchoredReceipt,
  submitConfirmedTestnetTransaction,
} from "./receiptAnchorClient.js";

const REVIEWER = "0x00000000000000000000000000000000000A11cE";
const CONTRACT = "0x000000000000000000000000000000000000c0de";
const RECEIPT = createProceedReceiptDraft({
  reviewerWallet: REVIEWER,
  decidedAt: 1782086940,
  nonce: "0x000000000000000000000000000000000000000000000000000000000000002a",
  caseRef: "RWA-DEMO-001",
});

test("creates a zero-value Injective deployment preview without prompting a wallet", () => {
  const preview = createDeploymentTransactionPreview();

  assert.equal(preview.kind, "contract-deployment");
  assert.equal(preview.chainId, 1439);
  assert.equal(preview.to, null);
  assert.equal(preview.value, 0n);
  assert.match(preview.data, /^0x[0-9a-f]+$/i);
  assert.ok(preview.data.length > 1000);
});

test("encodes a zero-value anchorProceed call without legal source text", () => {
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

test("estimates a zero-value transaction only on Injective EVM Testnet", async () => {
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
