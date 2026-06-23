export function createReceiptDraft({ decision, requestLabel, preflightVersion, timestamp }) {
  return {
    decision,
    requestLabel,
    preflightVersion,
    timestamp,
    canonical: [decision, preflightVersion, requestLabel, timestamp].join('|'),
  };
}
