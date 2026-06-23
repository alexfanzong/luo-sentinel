import { RWA_EVIDENCE } from '../app/src/lib/rwaEvidence.js';

export function createRwaPreflight() {
  return {
    request: {
      agent: 'LUO Sentinel',
      action: 'Review a tokenized treasury distribution request',
      target: 'Cross-border RWA participant group',
    },
    disposition: 'HUMAN_REVIEW_REQUIRED',
    version: '0.1',
    evidence: RWA_EVIDENCE.map((item) => ({
      jurisdiction: item.title,
      sourceId: item.id,
      signal: item.signal.toUpperCase(),
      summary: item.detail,
    })),
  };
}
