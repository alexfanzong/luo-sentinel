const VERSION = "LUO_SENTINEL_RECEIPT_V1";
const DECISION = "PREPARE_TESTNET_RECEIPT";

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createReceiptCommitment({ sourceAnchorId, timestamp }) {
  if (!sourceAnchorId?.trim()) {
    throw new Error("A reviewed source anchor is required for a receipt.");
  }

  if (!timestamp) {
    throw new Error("A receipt timestamp is required.");
  }

  const canonical = [VERSION, DECISION, sourceAnchorId, timestamp].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));

  return {
    canonical,
    commitment: `0x${toHex(new Uint8Array(digest))}`,
  };
}
