# Documentation Map

Start with the smallest authoritative surface.

## Current Product

- `WORKFLOW.md`: request shape, planning, judgment, operation, validation, and
  completion.
- `ARCHITECTURE.md`: current product, code, state, update, and ownership
  boundaries.
- `HARNESS.md`: product principles and installed-core model.
- `product/`: current product behavior and installation contract.
- `stories/`: consumer-owned phase packets that bind product authority to
  acceptance criteria and proof.
- `decisions/`: lasting choices future work must inherit.
- `plans/`: one durable working-memory document for work that needs it.
- [`patterns/encoding-invariants.md`](patterns/encoding-invariants.md): turn
  accepted architecture, reliability, security, and quality rules into native
  mechanical validation.
- `templates/`: optional decision, plan, runbook, and Harness-improvement
  structures.

## Consumer-Owned Truth

The consumer's README, product documents, architecture, code, tests, CI,
runtime signals, and application behavior remain authoritative. Harness does
not overwrite those with upstream product assumptions.

## Source Repository

- Root `README.md`: product overview, installation, maintenance, EOL, and
  development.
- `crates/harness/`: safe core installer/updater.
- `scripts/`: platform bootstrap, release, and validation entrypoints.
- `tests/`: behavior ownership and repository contract.

## History

The former SQLite control plane, protocol v1 packet lifecycle, migration
evidence, and compatibility documentation remain retired. The current
`stories/` directory contains lightweight Jev Match delivery packets explicitly
requested by the product owner; they do not restore that control plane.
