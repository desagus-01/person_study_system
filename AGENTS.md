<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# No guessing

All design authority belongs to the human. **Never guess a design or implementation decision.** If anything is ambiguous — naming, behavior, data shapes, UX, defaults, scope boundaries, prompt wording — STOP and ask with the ask-user-question tool before proceeding. If you are "a little unsure," you are unsure: ask. A wrong guess is far more expensive than a question. Ask early, ask specific, one question per call.

Concretely: first investigate and plan rigorously (asking the user design questions along the way), get the plan approved by the user, and only then implement. Implementation should be mechanical execution of an approved plan — not interpretation.

# Fork development guidance

## Product and implementation status

This fork combines LearnHarness's goal-driven teaching and conversational practice with learner-owned organisation, reconstruction, condition-aware evidence and scheduled review. It is intended for syllabus-driven classes and self-directed technical learning, including handwritten mathematics and work in external coding tools.

The combined product is an approved direction, not a claim that these additions already exist. The current runtime remains the LearnHarness application described in `docs/architecture.md`. The SQLite course/retention subsystem is planned; do not describe it as implemented until code and checks establish that fact.

Start with `docs/README.md`. Before implementation, read `docs/implementation-plan.md`, state its current integration stage in the plan and final report, and update the marker only when its exit criteria are met. The original project's Stage 7 is not this fork's stage. Historical upstream `docs/plan.md` and `docs/vision.md` are not the active fork roadmap.

## Code philosophy

Write straightforward TypeScript that a Python or R programmer can review quickly: small functions, descriptive names, explicit types, early returns, obvious data flow and plain SQL where appropriate. Follow existing repository patterns. Avoid type-level cleverness, unnecessary classes, premature abstractions, wrappers, dependencies and framework proliferation.

## Ownership and process boundaries

- Existing native conversation records remain canonical for session history and agent replay. Do not replace or duplicate that runtime.
- Deterministic application code owns the new subsystem's learning evidence, target/version identity, attempt conditions, assistance tracking, scheduling and learner-state transitions.
- Models may explain, diagnose, critique, generate task wording and propose changes. Model output is validated semantic evidence or a proposal, not an instruction to assign mastery or arbitrarily mutate canonical learning state.
- The extracted reference graph is not the learner's own model and is not proof of understanding or retention. Keep reference knowledge, learner organisation, reconstruction attempts and proposal layers distinct.
- The approved storage direction is a dedicated SQLite subsystem beneath `LH_DATA_DIR`, leaving upstream chat/graph/settings stores intact. There is no atomic transaction across those stores and SQLite.
- Keep domain contracts and deterministic rules in `src/core/`, concrete persistence in `src/store/`, orchestration in `src/server/`, model work in `src/agent/`, and UI/transport in `components/` and `app/`. Follow the barrel/import restrictions in `eslint.config.mjs`.
- Do not port the original project's Electron main/preload/IPC architecture or separate Pi configuration/runtime machinery. This fork's application logic runs in its Next server; Electron remains the existing desktop host.

## Working agreement

1. Inspect instructions, working-tree changes, exact implementation, dependencies and relevant tests before editing. Preserve unrelated user work; never discard it.
2. For substantial work, investigate, identify risks and acceptance criteria, get the plan approved, then implement the smallest coherent slice. Reopen material unanswered decisions with the available structured user-question tool rather than guessing.
3. Keep stages independently reviewable. Add focused automated tests for changed application behaviour and run the full relevant project checks. Documentation-only work needs link, terminology, command and diff review; do not claim application verification that was not run.
4. Use npm and the lockfile. Relevant application checks are `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`; follow `docs/development.md` for prerequisites and native/standalone checks. Existing tests use `node:test` via tsx, not Vitest. Tests must use injected models and disposable profiles, not paid calls or personal credentials.
5. Read the installed Next documentation before framework-facing changes. If dependencies or required docs are unavailable, report the limitation instead of inventing version-specific APIs.
6. Review the complete diff, including untracked files, and report actual checks, failures and unverified items. Never relabel a failure as a passing check.
7. Never commit or push unless explicitly requested. If requested, make each commit an atomic verified slice; do not commit or push known failing work. After a successful push, stop and give a brief status report before further implementation.
8. Preserve upstream licence/attribution. Do not copy real learner data, credentials, machine-specific MCP configuration or the original project's unfinished changes into this fork.

## Documentation routing

- Product/scope: `docs/product.md`.
- Learning activities, evidence conditions, misconceptions and evaluation: `docs/learning.md`.
- New subsystem ownership, graph semantics, storage and integration hazards: `docs/integration-architecture.md`, alongside `docs/architecture.md` for the actual runtime.
- Sequencing, stage status, migration/reuse decisions and completion criteria: `docs/implementation-plan.md`.
- Commands, data isolation, credentials and checks: `docs/development.md`.
- Runtime agents/prompts: `src/agent/prompts/README.md`, `docs/architecture.md` and the actual registry/schemas. Coding-agent `.pi/` resources are not runtime tutor instructions.
- Packaging/updater changes: `docs/desktop-release.md`, `electron/main.cjs`, `electron-builder.yml` and the relevant tests. Fork identity, profile isolation and update-feed safety must be resolved before packaged use with real data.

Read focused documents, not the entire archive. Distinguish current implementation, approved direction, proposals and historical research. When code contradicts a proposed design, investigate and surface the discrepancy rather than silently rewriting either authority.
