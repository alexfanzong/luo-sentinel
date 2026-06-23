export function createRwaPreflight() {
  return {
    request: {
      agent: 'LUO Sentinel',
      action: 'Review a tokenized treasury distribution request',
      target: 'Cross-border RWA participant group',
    },
    disposition: 'HUMAN_REVIEW_REQUIRED',
    version: '0.1',
    evidence: [
      {
        jurisdiction: 'United States',
        sourceId: 'US-RWA-001',
        signal: 'RESTRICTIVE',
        summary: 'Eligibility and distribution constraints require a separate review.',
      },
      {
        jurisdiction: 'Hong Kong',
        sourceId: 'HK-RWA-002',
        signal: 'EVOLVING',
        summary: 'The market route depends on jurisdiction-specific interpretation.',
      },
      {
        jurisdiction: 'Switzerland',
        sourceId: 'CH-RWA-003',
        signal: 'UNRESOLVED',
        summary: 'No universal eligibility conclusion is produced from this preflight.',
      },
    ],
  };
}
