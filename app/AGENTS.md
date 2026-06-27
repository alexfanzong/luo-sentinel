# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## LUO Sentinel Design Decisions

- The selected visual direction is the Atlas Canvas map-first screen.
- The landing page source of truth is the dark Atlas Canvas version from the
  Claude UI redesign: map background, centered LUO mark, short monospaced
  tagline, and one rounded Agent request capsule with the action button inside.
- Keep the landing Agent capsule refined rather than oversized; it should feel
  like a precise guard-layer request surface, not a human legal search box or a
  full-width hero banner.
- The preferred Step 3 direction is a `Review Matrix`: reference scope opens as
  a popover, while Scope / Source / Risk scores sit side by side as primary
  evidence. Avoid bubbly cards, floating pods, linear timelines, or game-like
  3D agents on this trust surface.
- Keep legal disclaimers sparse. Use the footer and critical handoff/execution
  boundaries for "not legal advice"; do not repeat long disclaimers in every
  card.
- The map represents cross-jurisdiction information relationships only; it must
  not imply authoritative boundaries, sovereignty, or legal conclusions.
- The primary demo uses LUO's reviewed Ondo OUSG RWA sample: United States,
  Hong Kong, Singapore, and European Union. `Cross-border` is the problem
  context, never a fifth jurisdiction label.
- Do not reuse Tornado Cash jurisdictions, source IDs, or risk labels on this
  RWA screen. Source anchors must come from the reviewed RWA mini-corpus.
- `Hold for counsel` is local-only and never uses gas. A future on-chain
  receipt may record only an explicit Proceed decision, with no cleartext legal
  content or reviewer identity on-chain.
- Each Proceed receipt covers the full four-jurisdiction RWA review scope. Map
  selection is only a reading focus, not a single-jurisdiction decision or an
  implied Hold for the other jurisdictions. A receipt may bind one non-sensitive
  cross-border scenario reference, never free-form legal or personal data.
- Testnet deployment and receipt anchoring must remain a two-step flow: show
  the target, `0 INJ` value, and fresh gas estimate first; request wallet
  confirmation only from a separately labelled action.
- After any contract deployment is mined, read its runtime bytecode and compare
  its Keccak-256 hash with the committed, locally compiled artifact before the
  address can be used to anchor a receipt. A mismatch is unverified and unusable.
- Keep the header minimal: LUO logo, LUO Sentinel, concise product descriptor,
  and Injective testnet status only.
- Keep the right decision rail sparse: selected signal, human-review boundary,
  and two actions. Do not reintroduce dense workflow rows or dashboard chrome.
