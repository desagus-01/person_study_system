# Integration implementation plan

Status: approved stage sequence and boundaries; each substantial implementation slice still needs an inspected, concrete plan and approval before code changes. New features are not implemented by this document.

Related: [index](README.md), [product](product.md), [learning framework](learning.md), [integration boundaries](integration-architecture.md), [current runtime](architecture.md), [development checks](development.md).

## Current integration stage

**Integration Stage 2 — Learner model and explicit reference bridge (active).**

The fork is the host application. The original project's **Stage 7 — Misconceptions and learner model** is reference context only, not this fork's stage. Do not continue its unfinished IPC/UI work here.

Documentation alignment is complete: all seven documentation-migration steps have been reviewed. Stage 0 baseline checks and fork-safety verification are complete for the approved Linux-only personal-use scope. Stage 1 SQLite foundation/minimum context is complete. Stage 2 is active: S2-CT1 and S2-CT2 are complete; S2-CT3 is next.

## Baseline and approved decisions

- Host: LearnHarness 0.4.1, inspected baseline `e69e85269c064c6c9c49a8b06ae78c06e79c4a63`, in `person_study_system`.
- Reference project: sibling `study_system`. Preserve it unchanged, including unfinished local work.
- Preserve the host's native conversations, reference graph, provider resolution, settings, desktop host and existing persistence.
- Add a dedicated SQLite course/retention subsystem beneath `LH_DATA_DIR`.
- Selectively adapt code/tests/design; begin with fresh learning data. No legacy-data importer.
- Support course-defined and personal technical goals, handwritten mathematics and external coding tools. No new integrated IDE or live capture requirement.
- Runtime/packaging verification scope is Linux-only for this personal fork deployment; cross-platform release readiness is not a Stage 0 requirement.
- First useful milestone: teaching → learner organisation → unsupported reconstruction/explanation → bounded feedback → persisted later review.
- Runtime teaching/practice prompts are unchanged by this documentation migration. Any later changes require their own explicit plan and tests.

## Delivery rules

Before each slice, inspect the working tree, exact implementation and relevant docs/tests; confirm its acceptance criteria, unresolved decisions and affected areas with the user. Do not silently choose an unapproved schema, UI policy or pedagogical threshold.

Keep stages small and independently reviewable; split large stages into separately verified slices. For application changes add focused automated coverage, then run `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`. Use the repository's existing `node:test`/tsx conventions, fake engines and disposable roots; do not add Vitest or make paid model calls for tests. Native/dependency/data-path changes also require relevant standalone/runtime smoke checks from [development.md](development.md).

Documentation-only slices require link/path/terminology/command consistency and complete diff review, not unrun application checks described as passes. Never overwrite unrelated edits. Commits/pushes are only on explicit request, one verified atomic slice at a time; stop after a successful requested push.

Every current stage must have explicit **commit targets** (small verified slices that can be committed atomically when requested). If the active stage has none, define/update commit targets before continuing implementation.

After each meaningful checkpoint, update this implementation plan with the **current position** (what is done, what is blocked, and the next target) plus actual verification results/limits.

Record actual results and limitations under the stage before advancing its marker. A stage is not complete because code compiles, a model once gave a good answer, or documentation claims completion.

## Reuse inventory

Paths below are in the original `study_system`, not files to copy blindly into this fork.

| Source | Treatment and limits |
|---|---|
| `src/main/database.ts`, `src/main/migrations.ts` | Adapt bootstrap, transactions and immutable-record safeguards into fresh migrations; do not import the old full schema/history |
| `src/main/study-model-repository.ts`, `src/shared/schemas.ts`, `src/shared/types.ts` | Split/adapt versioning, evidence refs and guarded lifecycle; remove IPC assumptions and UUID-only external-ID validation |
| `src/main/learning-engine.ts` and lifecycle tests | Reuse no-support classification as a starting point; add explicit feedback timing, unknown support, recency and submission snapshots |
| `src/main/review-engine.ts` | Adapt scheduling rules/persistence; separate deterministic policy from SQL. Interval ladder remains provisional |
| `src/main/reconstruction-engine.ts` | Adapt immutable baselines and structural comparison; exact proposition text is not semantic grading |
| `src/renderer/graph.ts` | Adapt graph element construction and meaningful relationship labels to a focused host workspace |
| `src/main/pi-coaching.ts`, `src/main/pi-teachback.ts`, `src/main/pi-hint-controller.ts`, agent-run records | Adapt bounded contexts, validation and audit patterns using the host's Pi engines/provider selection, not the old runner/config discovery |
| Proposal repositories/map-critic patterns | Adapt noncanonical storage and explicit versioned acceptance when the learner workspace needs them |
| Misconception repositories/engine, learner-model engine | Defer until the new evidence pipeline is reliable; historical success is not current retrievability |
| Original automated tests | Adapt relevant assertions/fixtures to node:test, revised IDs/storage and the new contracts; do not blindly preserve unsafe assumptions |
| Electron main/preload/IPC, full renderer, Forge/Vite setup, separate Pi runtime settings | Leave behind |
| Real learning data, credentials, `.pi/mcp.json`, unfinished original changes | Do not copy |

## Stage 0 — Documentation alignment and baseline safety

### Slices

1. Adapt `AGENTS.md`, central routing, product/learning rules, integration architecture, this plan, and reviewed coding-agent skills/templates. Preserve upstream runtime docs and separate runtime tutor prompts.
2. Verify Git state and baseline revision. Add the upstream remote only when authorised as implementation work. Install the lockfile with `npm ci` using the repository's Node 26 guidance; read relevant installed Next docs before framework-facing edits.
3. Establish baseline tests, typecheck, lint, production build and relevant standalone smoke results. Failures need diagnosis/documentation rather than being attributed to the integration without evidence.
4. Approve distinct fork application/profile identity and disable or replace the upstream update feed before packaged use with real data. Preserve licence/attribution and isolate credentials/data for testing.

### Affected areas / risks

`AGENTS.md`, `docs/`, `.pi/`; later `electron/main.cjs`, `electron-builder.yml`, package/release metadata and related tests. The baseline uses the upstream app name and update feed; dev profile isolation alone is not sufficient for a packaged fork. Naming/release policy requires approval.

### Checks and exit

- All seven documentation-migration steps reviewed; no runtime changes disguised as documentation.
- Actual baseline check results recorded, including blockers.
- Tests confirm app/profile and update isolation before any real-data packaged run.
- Working-tree/diff review complete. Only then advance to Stage 1.

### Commit targets (Stage 0)

- **S0-CT1 — Documentation alignment + plan routing baseline (done):**
  AGENTS/docs/.pi migration updates reviewed and verification recorded.
- **S0-CT2 — Node 26 baseline verification + subscription loader fix (done):**
  Node 26 checks executed; `electron/subscriptions.cjs` export-resolution issue fixed; full baseline checks recorded.
- **S0-CT3 — Packaged runtime smoke and isolation evidence (done for Linux scope):**
  Linux packaging rehearsal, packaged headless smoke, and owner-confirmed interactive checks (`window opens`, Settings shows `Updates unavailable`) are complete.
- **S0-CT4 — Stage-0 release-policy decision gate (done):**
  approved policy is private/personal use with no public release requirement;
  keep updater/feed disabled and continue explicit progress tracking in this plan.

## Stage 1 — SQLite foundation and minimum study context

### Slices

1. Specify the minimum course/personal-context, goal, target and reference-link contracts needed for the first loop; choose exact schema/operations with the user.
2. Verify a compatible SQLite driver in normal Node and the packaged Electron-hosted server; adapt the original driver only after this gate. A failed native load is a blocker, not permission to swap storage silently.
3. Introduce fresh transactional migrations, explicit repositories, data-root configuration and server composition. Keep concrete SQL out of core/browser code.
4. Define target/source revision snapshots, minimal reference deletion behaviour and a restorable database backup before real learner data is used.

Stage 1 slice-1 decisions approved (2026-11-04):

- Minimum persisted context: **goal + target + reference links only** (no course shell/deadline metadata yet).
- Record identity: **app-generated nanoid-style string IDs**.
- Initial write surface: **server-internal operations + tests only** (no new API/UI writes in this slice).

### Affected areas / risks

`config.ts`, `src/core/`, `src/store/`, `src/server/stores.ts`, permitted barrels; native tracing/packaging configuration if needed. Preserve upstream stores. Upstream IDs are not UUIDs; SQLite cannot enforce foreign keys into JSON files. Handle Next reload/module lifetimes and WAL safely.

### Checks and exit

Bootstrap/migration/reopen/rollback tests, foreign-key/immutability checks, scope/reference validation, isolated `LH_DATA_DIR`, minimal backup/restore, and both runtime smoke paths pass. Existing chat/graph golden fixtures remain readable. No legacy-data importer.

### Commit targets (Stage 1)

- **S1-CT1 — Minimum contracts/spec (done):**
  minimum goal/target/reference-link contracts are encoded with nanoid-style
  IDs and server-internal write operations, with focused tests.
- **S1-CT2 — SQLite driver compatibility gate (done):**
  `better-sqlite3` selected and verified in host Node and Electron bundled
  Node runtime with a dedicated offline runtime probe.
- **S1-CT3 — Fresh migrations + repositories + composition wiring (done):**
  introduced SQLite schema/migration, persistence adapter, and server
  composition wiring for the Stage-1 minimum study context.
- **S1-CT4 — Snapshot/deletion/backup baseline (done):**
  added optional link snapshots, unresolved-link read projection policy, and
  internal backup/restore helpers with tests.

## Stage 2 — Learner model and explicit reference bridge

### Slices

1. Adapt versioned learner concepts and proposition-labelled directed relationships with source links.
2. Add separate layout state and a focused React Flow workspace using the existing dependency, not the old renderer wholesale.
3. Allow explicit links from a teaching passage or reference proposition/chain into learner-authored organisation. Do not block short lessons on the automatic-extraction threshold.
4. Add proposal/accept/reject behaviour where needed; proposals are noncanonical until validated acceptance. Never create a full corrected learner map by default.

### Affected areas / risks

New core contracts, SQLite repositories, server operations and focused components/routes through existing barrels. A multi-premise reference argument is not equivalent to independent learner arrows. Identity/equivalence proposals require policy; layout must not rewrite semantics.

### Checks and exit

Versioning, provenance, explicit acceptance and graph/layout separation tests pass. A learner can create/revise a small lesson-linked model without mutating the upstream graph. UI interaction coverage verifies authoring and proposal resolution.

### Commit targets (Stage 2)

- **S2-CT1 — Versioned learner-model core and reference bridge (done):**
  one learner model per existing target; immutable, superseding concept and
  relationship versions; directed proposition-labelled relationships; and
  zero-or-more graph-node/graph-chain/notes-source provenance links with
  snapshots. This target is server-internal only: no workspace UI, passage
  links, or proposal-resolution behaviour.
- **S2-CT2 — Graph/layout separation and focused workspace (done):**
  persists target-scoped concept positions separately from immutable learner
  semantics and provides a direct-target React Flow workspace for creating and
  revising concepts and proposition-labelled relationships. Model evaluation,
  feedback, provenance selection, deletion and proposal resolution remain
  outside this target.
- **S2-CT3 — Teaching/reference selection bridge:**
  allow deliberate selection of available reference propositions/chains into
  learner organisation; define and implement teaching-passage links only after
  their stable external-reference contract is approved.
- **S2-CT4 — Noncanonical proposal resolution:**
  add proposal/accept/reject behaviour where needed, retaining proposals as
  noncanonical until explicit validated acceptance.

## Stage 3 — Attempts and condition-aware evidence

### Slices

1. Specify task/baseline versions, private criteria and the guarded attempt lifecycle.
2. Add immutable events for support exposure, hint request/delivery, response, feedback/answer reveal and assessment, with retry/idempotency protection.
3. Freeze pre-feedback/pre-submission conditions; record external-help declarations, unknowns and recent learning context separately from app observations.
4. Define learner-facing task projections and target-scoped assessment context. Do not leak solutions through raw task payloads, visible targets or inherited file/research tools.

### Affected areas / risks

Core rules/contracts, repositories and server operations; task UI/projections. Upstream R0 is still help, not the old no-help zero. Feedback and full-answer exposure differ. Unknown assistance is not positive independent evidence. Later feedback must not change pre-submission conditions.

### Checks and exit

State/transition, source/hint/reveal timing, refresh/reconnect, duplicate submission, cross-scope IDs, exposure monotonicity and private-answer payload tests pass. Submitted work survives assessment failure. Independent and delayed-performance labels remain distinguishable.

## Stage 4 — First complete teaching-to-retention loop

### Slices

1. Associate a goal and selected teaching context with learner-generated relationships.
2. Snapshot a learner-authored map submission and evaluate its concepts and proposition-labelled relationships against bounded target/reference context. Return source-grounded, auditable feedback without silently rewriting the learner map; preserve uncertainty, omissions and valid alternatives rather than forcing a corrected canonical map.
3. Capture immutable baselines and implement source-hidden small-map reconstruction plus a focused explanation/teach-back task.
4. Adapt auditable bounded diagnostic/coaching calls to the host's Pi engine/provider seam. Validate expected judgement coverage, known IDs, source references and learner spans; preserve uncertain/ungradable outcomes.
5. Keep structural recovery distinct from correctness/equivalence. Specify how reference-grounded assessment handles paraphrases, incorrect learner baselines and valid alternative explanations.
6. Adapt the deterministic interval baseline and review observations; expose a due-review action that uses the same attempt/condition system.

### Affected areas / risks

Learner workspace, retention task/review UI, agent context/output contracts, server orchestration and SQLite records. No second coding-agent runtime. A schema-valid model answer is not proof of sound grading or hint safety. Scheduling must consume validated evidence, not arbitrary model instructions.

### Checks and exit — first useful milestone

With an injected model and disposable data, complete teaching link → learner-authored map → bounded map feedback → unsupported retrieval → feedback → persisted later review, then restart and complete that review. Test map omissions, incorrect relationships, valid alternatives, uncertainty, assisted/unknown/unsound paths, failed model calls and incorrect-baseline cases. Map feedback must cite the submitted snapshot and supplied references and must not mutate canonical learner semantics. Only qualifying evidence affects independent-success scheduling. A configured live-model inspection, if authorised, is reported separately from deterministic tests and does not replace them.

Stop and evaluate this loop before broadening the application. Course-document automation, handwriting and coding assessment are not prerequisites to validate it.

## Stage 5 — Native practice evidence bridge

### Slices

1. Associate practice demands with confirmed learning targets while preserving informal untracked practice.
2. Add application-owned support tracking for explicitly tracked attempts; do not trust a final model `rung`/verdict as the complete condition record.
3. Project successfully persisted problem/response/conclusion activity into durable evidence with stable chat/message/tool-call identities and explicit reconciliation.
4. Define partial-save/error handling; preserve recorded semantic assessments rather than regrading differently on each replay. Treat old uninstrumented sessions as unknown, not cold retrieval.

### Affected areas / risks

`src/agent/tools/practice.ts`, `src/core/input-events.ts`, `src/server/turn-service.ts`, `src/server/chat-handler.ts` and focused bridge modules/tests. Keep native conversation ownership and tool gating intact. Cross-store commits are not atomic; ephemeral SSE events are not the evidence ledger.

### Checks and exit

Practice-flow, retries, aborts, dismissals, compaction, reconnect, restart and injected write-failure tests show no duplicate observations or invented success. Recovery failures are visible. Untracked sessions retain existing behaviour and do not silently gain verified-retention labels.

## Stage 6 — Syllabus-aware coursework

### Slices

1. Extend the minimum context with confirmed syllabus outcomes, problem families, question/solution/rubric roles and deadlines; begin with manual linking.
2. Add durable document revisions and page/section/question anchors. Reuse PDF/text conversion without assuming existing graph import stores a complete source library.
3. Add bounded extraction proposals with provenance, uncertainty and confirmation rather than automatic curriculum truth.
4. Link goals to lessons, learner relationships and representative problems. Keep coverage, deadlines and demonstrated capability separate; define workload priorities explicitly.

### Affected areas / risks

Course/document storage, import coordination, selected existing conversion/import UI, task/source context builders. Solutions must not leak via generic reference extraction or independent-task context. Path/name-based identity alone is insufficient for document revisions. Do not silently rewrite upstream plan trees.

### Checks and exit

A representative course links syllabus → target → problem → attempt → later review. Tests cover duplicate/revised documents, retained historical anchors, solution separation and unconfirmed AI proposals. Fixtures use permitted/synthetic material, not a copied personal corpus.

## Stage 7 — Handwritten mathematics submissions

### Slices

1. Specify bounded image/PDF submissions associated with an existing problem/attempt; preserve original artefacts and storage/deletion policy.
2. Reuse host image/PDF capabilities where suitable; distinguish recognition from mathematical reasoning and allow confirmation/correction of uncertain transcription.
3. Support approach checks, minimal hints and completed-attempt assessment through the established condition model.
4. Diagnose assumptions/method/justification/execution with evidence, valid alternative routes and an earliest-break report only when defensible.

### Affected areas / risks

Artefact storage, upload routes/UI, vision/assessment contexts and tests. Existing path chips/read tools are not a sandboxed upload facility; PDF text conversion is not handwriting OCR. Record recognition corrections separately from mathematical response revisions.

### Checks and exit

Bounded-upload/path/type/size handling, unreadable notation, recognition corrections, alternative solutions, omissions, calculation slips and explicit contradictions are covered. Recognition ambiguity never confirms a misconception. No live capture or mandatory full transcription.

## Stage 8 — External code and maths/code bridge tasks

### Slices

1. Collect selected code/files, notebook exports, plots, test outputs and explanations from external tools with explicit provenance/assistance declarations.
2. Add prediction-before-execution, hand-case-to-implementation, derivation-to-code, library comparison and numerical/boundary investigation tasks.
3. Record explanation/derivation/calculation/selection/implementation/debugging evidence separately and connect them to shared goals without conflating competence.

### Affected areas / risks

Artefact/task contracts, submissions/context builders and focused UI. Do not inspect arbitrary projects by default, claim tests passed from static code, or execute submitted code in the app. Automatic execution requires separate sandbox/security approval.

### Checks and exit

One topic links mathematical explanation, handwritten work and an external implementation. Tests distinguish learner-supplied execution claims from observed evidence, external assistance from unaided work, and implementation success from mathematical justification. No integrated IDE.

## Stage 9 — Cautious learner summaries, remediation and hardening

### Slices

1. Adapt misconception occurrences and explicit reviewed lifecycle transitions after source-grounded proposition assessment is reliable. An omission, ambiguous span or recognition failure is not a contradiction.
2. Derive evidence-backed target summaries with dates, versions and uncertainty; distinguish historical success from current retrievability and transfer. Approve thresholds before encoding them.
3. Feed bounded summaries into relevant teaching/practice contexts and add targeted repair with later independent checks. Specify workload/deadline policies without claiming an optimised scheduler.
4. Extend backup/restore/export, privacy purge/reference deletion, artefact lifecycle, profile/update safety and packaging checks across the complete system.
5. Maintain human-reviewed assessment examples and evaluate delayed independent outcomes/time against the host teaching/practice baseline.

### Affected areas / risks

Evidence/summary/misconception rules, repositories, bounded agent context, review UI, export/backup and desktop verification. Keep model diagnosis separate from canonical transitions. Avoid opaque mastery percentages, ever-success as a current-memory estimate and premature learned scheduling.

### Checks and exit

Contradiction/span/transition/recurrence safeguards, version/recency summaries, backup/restore and relevant packaged runtime checks pass. Views cite evidence and limitations. Evaluation distinguishes contract correctness, model quality and educational effectiveness; do not invent efficacy results.

## Not authorised by this sequence alone

- A wholesale code/schema migration or actual legacy-data import.
- New provider runtime, replacement IPC stack, ORM/framework or distributed queue.
- Autonomous model writes, model-set due dates/mastery or automatic full learner maps.
- Arbitrary code execution, live camera/handwriting capture, multi-user hosting or learned scheduling.
- Specific schema/UX/release names, equivalence rules, delay/capability thresholds or automatic misconception promotion not approved in a stage's specification.
- Runtime prompt rewrites, deployment, commits, pushes or releases without their separate approval.

## Verification record

### Documentation alignment — complete

All seven steps are complete: adapted agent instructions, central index, product/learning framework, integration boundaries, staged plan, coding-agent skills/templates, and coherent-contract review.

Verification performed:

- Read-only validation passed for all 11 changed/new Markdown files and 51 relative links, npm script references, skill/template metadata, final newlines and trailing whitespace.
- The original `AGENTS.md` prefix, including Next.js and approval instructions, is preserved verbatim.
- Reviewed the tracked diff and every untracked file as a full new-file diff; checked terminology, current/planned authority, graph/ID/assistance boundaries and source reuse paths. New-file `git diff --no-index` returns status 1 when displaying a difference; that is not an application-check failure.
- `git diff --check` passed for tracked changes; the read-only validator also covered whitespace in all new files.
- Confirmed the change set contains only `AGENTS.md`, five new docs and five coding-agent resource files. Existing runtime docs, runtime tutor prompts, source, dependencies, release configuration and the original project were not modified by this work.

Limitations: external research links were retained from the earlier research review, not re-fetched during this patch. Resource frontmatter/content was checked, but discovery/loading was not exercised in a fresh Pi session in the fork. No application tests, dependency install, model requests, production build, desktop launch or native SQLite compatibility check were run. Passing results quoted in the original project's old docs do not apply to this fork.

Next: complete the remaining Stage 0 baseline and fork-safety slices under a concrete approved implementation plan. No commits or pushes were made.

### Stage 0 baseline and fork safety — complete for approved Linux-only scope

Current position (2026-11-04): S0-CT1, S0-CT2, S0-CT3 and S0-CT4 are complete for the approved Linux-only personal-use scope. Next stage: Stage 1 slice 1 contract/spec definition.

Approved fork decisions implemented in this slice:

- Packaged Electron builds are named **Person Study System**. The package and
  Linux desktop identifiers are `person-study-system` and
  `person-study-system.desktop`; the Electron app ID is
  `local.person-study-system`. The Electron main process sets this name before
  choosing `userData`, keeping desktop data/auth roots separate from
  LearnHarness.
- There is no update publisher in `electron-builder.yml`. Packaged and
  development shells report **Updates unavailable** and do not bundle or load
  `electron-updater`, contact an update feed, accept `LH_UPDATE_FEED`, or
  schedule/download/install updates. The General settings row visibly reports
  that state and hides update controls/release notes.
- The upstream release-verification configuration test now explicitly asserts
  that this fork fails closed rather than qualifying as an upstream updater
  release. The upstream release workflow and release verifier remain retained
  reference material, not this fork's active release path.
- Stage-0 release-policy decision (owner-approved): this package is for
  private/personal use; there is no public-release requirement at this stage.
  Keep update feeds/updater disabled and keep progress visible via this
  implementation-plan verification record.

Verification actually performed:

- Downloaded and used a local Node `v26.13.0` toolchain
  (`/tmp/person-study-node26/node-v26.13.0-linux-x64`) to run the authoritative
  baseline checks.
- `npm ci` completed under Node 26. npm reported 10 vulnerabilities and blocked
  install scripts for five packages pending an explicit allow-list review;
  neither result was remediated in this slice.
- Diagnosed the previous `tests/subscription-auth.test.ts` failure
  (`ERR_PACKAGE_PATH_NOT_EXPORTED`) and updated
  `electron/subscriptions.cjs#loadSubscriptionSDK` to load Pi packages via their
  public ESM exports with dynamic `import(...)` instead of CJS export
  resolution.
- Confirmed the subscription/web auth paths with a focused run:
  `node ./node_modules/tsx/dist/cli.mjs --test tests/subscription-auth.test.ts tests/web-subscriptions.test.ts`
  (24/24 passing).
- `npm test` passed under Node 26 (3,152/3,152 passing).
- `npm run typecheck` passed. `npm run lint` exited successfully with one
  pre-existing `@next/next/no-head-element` warning in
  `tests/source-name-ui.test.tsx`.
- `npm run build` passed. Turbopack reported four existing dynamic-filesystem
  tracing warnings in the headless/PDF/graph runtime paths.
- `node scripts/smoke-provider-runtime.mjs && node scripts/build-server.mjs &&
  node scripts/smoke-server.mjs` passed under host Node; the standalone server
  booted with isolated data/auth and served `/`, `/api/graph`, `/api/models`,
  and `/api/settings`.
- `node scripts/smoke-server.mjs --electron` also passed, confirming the same
  standalone boot checks under Electron's bundled Node runtime.
- `node ./node_modules/electron-builder/cli.js --linux --x64 --publish never`
  succeeded locally, producing Linux rehearsal artifacts in `dist/`
  (`Person Study System-0.4.1-x86_64.AppImage`,
  `Person Study System-0.4.1-amd64.deb`, and `latest-linux.yml`).
- Launched the packaged Linux AppImage under `xvfb-run` with an isolated
  `HOME`/`XDG_CONFIG_HOME`. The app booted its standalone server, wrote data
  under `~/.config/Person Study System/` (no `LearnHarness` profile path), and
  logged `updates unavailable: no release feed is configured for Person Study System`.
  The run was headless and short-lived; a later GPU-process fatal occurred in
  the CI-like virtual display environment.
- Inspected the packaged `.deb` contents directly (`ar` + `tar`) and confirmed
  identity metadata and desktop integration paths:
  `Package: person-study-system`, desktop entry
  `usr/share/applications/person-study-system.desktop`, and
  `Name=Person Study System`.
- Attempted scripted packaged-UI navigation over Electron remote debugging in
  `xvfb-run` to verify the Settings update banner interactively. The session
  was unstable in this headless virtual-display path (frame detach/timeouts),
  so this did not produce a reliable interactive assertion.
- Owner confirmed packaged interactive checks in this environment: the app
  window opens and Settings explicitly reports `Updates unavailable`.

Residual limitations (out of current Linux-only scope):

- Deterministic scripted packaged-UI assertions are still limited in headless
  remote-debug automation (`xvfb-run` frame-detach/timeouts).
- macOS signing/notarization and Windows packaged checks remain unverified.

These limitations do not block Stage 0 completion under the approved
Linux-only personal-use scope.

### Stage 1 minimum contracts/spec, driver gate, store wiring, and backup baseline — complete

Current position (2026-11-06): S1-CT1 through S1-CT4 remain complete.
Stage 2 is active. S2-CT1 (versioned learner-model core and reference bridge)
and S2-CT2 (graph/layout separation and focused authoring workspace) are
complete. S2-CT3 (deliberate teaching/reference selection bridge) is next and
needs its stable selection/reference contract before implementation. Stage-2
versioning and graph/layout separation checks are now represented; the full
Stage-2 exit remains incomplete until the selection bridge, proposal behaviour
and their interaction coverage are complete.

Implemented in the Stage-1 checkpoint:

- Added pure minimum-contract logic in `src/core/study-context.ts`:
  state shape, write-action parsing, state parsing, and deterministic apply
  logic for `create_goal`, `create_target`, and `create_reference_link`.
- Extended the contract with optional opaque JSON `refSnapshot` payloads and
  an unresolved-link read projection (`status: "resolved" | "unresolved"`).
- Added a transitional Stage-1 persistence port type
  `StudyContextStore` in `src/core/ports.ts`.
- Re-exported the new core module from `src/core/index.ts`.
- Added focused coverage in `tests/study-context.test.ts`.
- Added `better-sqlite3` dependency and `@types/better-sqlite3` for the
  approved Stage-1 driver gate.
- Added `scripts/smoke-sqlite-runtime.mjs` to verify SQLite runtime
  compatibility offline in host Node and Electron's bundled Node runtime.
- Added `LEARNING_DB_FILE` in `config.ts` (`<LH_DATA_DIR>/learning.sqlite`).
- Added `src/store/study-context.ts` with:
  - SQLite open/bootstrap (`foreign_keys=ON`, `journal_mode=WAL`),
  - schema migrations through `user_version=2` for `goals`, `targets`,
    `reference_links`, and optional `ref_snapshot`,
  - replace-whole read/write adapter implementing `StudyContextStore`,
  - internal backup/restore helpers (`VACUUM INTO` backup + integrity-checked
    restore), and
  - server wiring via `src/server/stores.ts`.
- Added focused persistence tests in `tests/study-context-store.test.ts`
  (including backup/restore round-trip).

Verification run:

- `node ./node_modules/tsx/dist/cli.mjs --test tests/study-context.test.ts tests/study-context-store.test.ts` (11/11 pass)
- `npm run typecheck` (pass)
- `npm run lint` (pass with one pre-existing warning in `tests/source-name-ui.test.tsx`)
- `npm run build` (pass; four pre-existing Turbopack warnings)
- `node scripts/smoke-sqlite-runtime.mjs` (pass in host Node and Electron runtime)
- `node scripts/build-server.mjs && node scripts/smoke-server.mjs && node scripts/smoke-server.mjs --electron` (pass)
- `npm test` (3,163/3,163 pass)

### Stage 2 S2-CT1 learner-model core and reference bridge — complete

Implemented:

- Added `src/core/learner-model.ts` with target-scoped learner models,
  stable concept/relationship identities, immutable superseding versions,
  directed proposition labels, source-link snapshots and current-version/
  unresolved-provenance projections.
- Added a server-internal `LearnerModelStore` port and learner-model service.
  The service accepts writes only for targets that exist in the Stage-1 study
  context; no route or workspace UI was added.
- Added SQLite migration 3 for learner models, concept/relationship versions
  and relationship provenance links. The model target key permits at most one
  model per target and foreign keys prevent a referenced target from being
  removed.
- Changed the Stage-1 context persistence write so retained targets are
  upserted rather than rebuilt. Adding later context therefore preserves
  existing learner-model history; removing a referenced target fails
  transactionally through the restrictive foreign key.
- Added focused core, service and SQLite persistence tests.

Verification run:

- `node ./node_modules/tsx/dist/cli.mjs --test tests/study-context.test.ts tests/study-context-store.test.ts tests/learner-model.test.ts tests/learner-model-store.test.ts tests/learner-model-service.test.ts` (16/16 pass)
- `npm run typecheck` (pass)
- `npm run lint` (pass with the pre-existing `@next/next/no-head-element`
  warning in `tests/source-name-ui.test.tsx`)
- `npm test` (3,168/3,168 pass)
- `npm run build` (pass with four pre-existing Turbopack dynamic-filesystem
  tracing warnings)
- `node scripts/smoke-sqlite-runtime.mjs` (pass in host Node and Electron's
  bundled Node runtime)
- `node scripts/build-server.mjs && node scripts/smoke-server.mjs && node scripts/smoke-server.mjs --electron` (pass)

### Stage 2 S2-CT2 graph/layout separation and focused workspace — complete

Implemented:

- Added a browser-safe learner-model layout contract keyed by stable concept
  lineage IDs. Layout contains only finite target-scoped positions; semantic
  concept/relationship versions remain unchanged and separately persisted.
- Added SQLite migration 4 and layout persistence. The existing replace-whole
  semantic adapter now retains positions transactionally across semantic
  revisions, while layout writes reject concepts outside the target model.
- Extended the learner-model service with a serialisable workspace projection,
  validated layout writes and an HTTP response seam with explicit missing-target
  and invalid-input responses.
- Added `GET`/`PATCH`/`PUT` transport at
  `/api/study/targets/[targetId]/learner-model` and a direct-target workspace at
  `/study/targets/[targetId]/model` using the existing React Flow dependency.
- The workspace supports adding and revising learner concepts, dragging a
  directed connection and requiring a proposition label before persistence,
  revising relationship propositions, and saving concept positions on drag
  completion. Deletion, provenance picking, proposals and model evaluation are
  deliberately not included.
- Recorded the owner-approved remaining workflow in Stage 4: snapshot and
  evaluate a learner-authored map against bounded references, provide auditable
  feedback without silently mutating the map, and preserve uncertainty and
  valid alternatives.

Verification run:

- Focused Stage-1/Stage-2 contract, store, service, HTTP and workspace tests
  (21/21 pass), including a mounted client interaction that submits a concept
  write and renders the returned node.
- `npm test` (3,173/3,173 pass).
- `npm run typecheck` (pass).
- `npm run lint` (pass with the pre-existing `@next/next/no-head-element`
  warning in `tests/source-name-ui.test.tsx`).
- `npm run build` (pass with four pre-existing Turbopack dynamic-filesystem
  tracing warnings).
- `node scripts/smoke-sqlite-runtime.mjs` (pass in host Node and Electron's
  bundled Node runtime).
- `node scripts/build-server.mjs && node scripts/smoke-server.mjs && node scripts/smoke-server.mjs --electron` (pass).

Limitations:

- The workspace is intentionally a direct target route because goal/target
  management has no approved user-facing navigation yet.
- Automated browser launch was unavailable in this environment because the
  Playwright Chrome distribution is not installed. The mounted React DOM test,
  production build, route boot and standalone smoke paths passed; no claim of a
  separate real-browser visual inspection is made.
- The local Node 26 toolchain used in the Stage-0 baseline was not available in
  this session. Application checks ran under host Node `v22.23.4`; the Electron
  runtime probes used bundled Node `v24.22.0`. Node 26 remains covered by the
  earlier baseline, but this exact S2-CT2 patch was not re-run under Node 26.
