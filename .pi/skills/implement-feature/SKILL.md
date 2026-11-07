---
name: implement-feature
description: Implement an approved feature in this LearnHarness fork while preserving its runtime and staged integration boundaries. Use for non-trivial application feature work.
---

# Implement an approved feature

All paths below are repository-root-relative. Use this coding-agent skill for development work, not as a runtime tutor prompt.

1. Read `AGENTS.md` and `docs/README.md`. Read `docs/implementation-plan.md` and state the current integration stage. New product/retention docs describe approved direction, not shipped code.
2. Inspect working-tree changes, exact affected implementation, dependency configuration and relevant tests. Preserve unrelated work; do not copy unfinished changes from the original project.
3. Choose the smallest relevant docs: `docs/product.md` for scope, `docs/learning.md` for behaviour/evidence, `docs/integration-architecture.md` for extension boundaries, and `docs/architecture.md` for the actual runtime. Use `docs/development.md` for commands and isolation.
4. Present the smallest coherent slice, affected areas, observable acceptance criteria, tests, risks and unresolved choices. Obtain approval before implementing. Use the structured user-question tool for material ambiguity rather than guessing.
5. Before framework-facing changes read the relevant installed Next guide under `node_modules/next/dist/docs/`. Report missing dependencies/docs instead of inventing version-specific APIs.
6. Implement within the existing import/barrel law: contracts/rules in core, concrete storage in store, orchestration in server, model work in agent, and UI/transport in components/app. Do not transplant the original Electron/preload/IPC or separate Pi runtime.
7. Add focused node:test coverage using injected engines/ports and disposable data/auth roots. Do not add Vitest or use paid model calls/personal data. Run focused tests and `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; add relevant native/standalone gates for dependency, persistence or packaging changes.
8. Inspect the full diff, including new files. Review correctness, state ownership, leakage, failure/retry behaviour, compatibility and unrelated changes. Fix findings and recheck.
9. Update docs/stage evidence accurately. Advance the integration marker only when its exit criteria pass. Summarise actual checks, architectural decisions and unverified limitations; do not inherit historical test claims from either project.

For documentation-only work, validate links/paths, command/terminology/status consistency and the complete diff rather than claiming unrun application checks. Do not alter runtime prompts or dependencies under a documentation-only approval.

Never commit or push unless explicitly requested. Preserve licence/attribution. If a push is requested and succeeds, stop after a brief status report. Do not commit/push known failing work.
