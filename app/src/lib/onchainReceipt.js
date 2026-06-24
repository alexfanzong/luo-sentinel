import canonicalize from "canonicalize";
import {
  AbiCoder,
  getAddress,
  isHexString,
  keccak256,
  toUtf8Bytes,
} from "ethers";

import { RWA_EVIDENCE } from "./rwaEvidence.js";

export const PRODUCT_REF = "luo-ondo-ousg-eligibility-v0";
export const PROCEED_SCHEMA_VERSION_HASH = keccak256(
  toUtf8Bytes("LUO_SENTINEL_PROCEED_RECEIPT_V1"),
);

const EVIDENCE_SCHEMA_VERSION = "1.0";
const EVIDENCE_REVIEWED_AT = 1780790400;
const TESTNET_CLOCK_SKEW_BUFFER_SECONDS = 60;
const coder = AbiCoder.defaultAbiCoder();

export function getSafeDecisionTimestamp(currentUnixSeconds) {
  if (!Number.isInteger(currentUnixSeconds) || currentUnixSeconds <= TESTNET_CLOCK_SKEW_BUFFER_SECONDS) {
    throw new Error("A current whole-second timestamp is required.");
  }

  return currentUnixSeconds - TESTNET_CLOCK_SKEW_BUFFER_SECONDS;
}

export function buildRwaEvidenceSet() {
  return {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    productRef: PRODUCT_REF,
    snapshotTakenAt: EVIDENCE_REVIEWED_AT,
    signals: RWA_EVIDENCE.map((item) => ({
      jurisdiction: item.title,
      signal: item.signal,
      sourceAnchor: item.id,
    })),
  };
}

export function createProceedReceiptDraft({ reviewerWallet, decidedAt, nonce }) {
  let normalizedWallet;
  try {
    normalizedWallet = getAddress(reviewerWallet);
  } catch {
    throw new Error("A valid reviewer wallet is required.");
  }

  if (!Number.isInteger(decidedAt) || decidedAt <= 0) {
    throw new Error("A whole-second decision timestamp is required.");
  }
  if (!isHexString(nonce, 32) || nonce === "0x".padEnd(66, "0")) {
    throw new Error("A non-zero 32-byte receipt nonce is required.");
  }

  const evidenceSet = buildRwaEvidenceSet();
  const canonicalEvidence = canonicalize(evidenceSet);
  if (canonicalEvidence === undefined) {
    throw new Error("Evidence canonicalization failed.");
  }

  const evidenceHash = keccak256(toUtf8Bytes(canonicalEvidence));
  const productRefHash = keccak256(toUtf8Bytes(evidenceSet.productRef));
  const receiptHash = keccak256(
    coder.encode(
      ["bytes32", "bytes32", "bytes32", "address", "uint64", "bytes32"],
      [
        PROCEED_SCHEMA_VERSION_HASH,
        evidenceHash,
        productRefHash,
        normalizedWallet,
        decidedAt,
        nonce,
      ],
    ),
  );

  return {
    evidenceSet,
    evidenceHash,
    productRefHash,
    receiptHash,
    reviewerWallet: normalizedWallet,
    decidedAt,
    nonce,
  };
}
