# Course and retention integration boundaries

Status: approved ownership and integration direction; structures below are design requirements/proposals, not an implemented schema or API.

Related: [current runtime](architecture.md), [product](product.md), [learning/evidence rules](learning.md), [implementation stages](implementation-plan.md).

## Preserve the host

The inspected baseline is LearnHarness 0.4.1 at `e69e85269c064c6c9c49a8b06ae78c06e79c4a63`. It runs a Next server with native Pi agents and an Electron desktop host. Its lockfile pins Next 16.4.3, React 19.2.8, Electron 44.9.3 and Pi agent-core/pi-ai 1.4.0. Consult the lockfile/installed docs again before implementation; this is baseline context, not a request to upgrade or freeze dependencies forever.

Existing boundaries remain:

| Area | Role |
|---|---|
| `src/core/` | Contracts, deterministic domain rules and read projections |
| `src/store/` | Concrete persistence adapters |
| `src/server/` | Composition, admission, validated operations and lifecycle coordination |
| `src/agent/` | Model calls, tools, prompt composition and bounded semantic work |
| `components/`, `app/` | UI and transport through permitted barrels |
| `electron/` | Existing desktop host/security/provider boundary, not the new learning engine |

Follow the actual zones in `eslint.config.mjs`: components import the browser-safe core barrel; app code imports core/server barrels; core cannot import agent/server/store; agents receive dependencies rather than importing server/store adapters. SQL and filesystem access do not belong in browser modules or deterministic core. Follow the existing implementation rather than assuming the lint rules prove every possible architectural property.

Do not port the old Electron main/preload/IPC layer, standalone renderer, or Pi coding-agent configuration discovery. Use the host's provider/model resolution and native-agent seams rather than adding another runtime.

## State ownership

| State | Canonical owner / intended storage |
|---|---|
| Native sessions, plan snapshots, conversation outcomes and usage | Existing chat JSON store |
| Background computation/delivery obligations | Existing job store |
| Extracted propositions, reasoning chains and coverage | Existing graph JSONL/JSON stores |
| Provider settings, credentials, prompt overrides and presentation | Existing stores and desktop boundaries |
| New courses/personal contexts, goals and confirmed target links | Planned SQLite subsystem |
| Learner concepts/relationship versions, layouts and proposal resolution | Planned SQLite subsystem |
| Task/baseline versions, attempts, exposure events and assessment evidence | Planned SQLite subsystem |
| Review observations, schedules and cautious learner/misconception state | Planned SQLite subsystem |
| Selected source/work artefact contents | Planned durable artefact storage under the data root, with SQLite metadata/provenance; exact layout pending |

Native conversations remain canonical session records. They are not sufficient canonical retention state. A practice verdict is model-assessed session evidence; a deterministic, validated operation decides whether/how it contributes to retention records. No duplicate chat engine, duplicate reference graph, or automatic bidirectional graph synchronisation is approved.

## SQLite boundary

A dedicated database lives beneath `PATHS.data` / `LH_DATA_DIR`. Its exact name/schema and driver configuration require stage specification. Adapt the original plain-SQL and transaction patterns. Verify driver loading, migrations, foreign keys, WAL handling and lifecycle in both normal Node and the packaged Electron-hosted server before relying on it.

Do not copy the original migrations wholesale: their course/source/UUID/relationship assumptions are not the host's contracts. Use fresh migrations and fresh learning data. Port repositories/rules incrementally behind explicit operations. SQL-backed original engine functions may need separation into deterministic rules plus persistence orchestration to respect the fork's import law.

Concrete adapters belong in `src/store/`; their narrow domain-facing operations are composed server-side. Avoid a generic database/SQL tool or public arbitrary-event endpoint. Initialise resources safely for Next development reload/module entries and maintain one server owner per profile; do not assume a singleton provides cross-process locking.

No new ORM, generic service framework, queue system, IPC stack or provider framework is approved by this document.

## Distinct linked representations

1. **Curriculum/goals:** intended capabilities, problem families and deadlines. AI proposals need confirmation; coverage is not performance.
2. **Reference knowledge:** upstream proposition nodes and reasoning chains with provenance. Extraction does not make claims infallible or establish learner capability.
3. **Learner model:** learner-authored concepts and proposition-labelled relationships. Visual grouping/layout is not ontology.
4. **Reconstruction:** an immutable-baseline attempt stored separately from the learner model.
5. **Proposal overlay:** noncanonical suggestions with explicit acceptance/rejection through validated versioned writes.
6. **Evidence:** submitted behaviour and its conditions; not another editable reference graph.

An upstream proposition can correspond to a learner relationship, a concept definition or several learner statements. Preserve explicit links rather than assuming one-to-one equivalence. A chain's premises jointly entail its conclusion; do not flatten an AND dependency into independent implications. Conditions, alternative arguments and source assumptions must not vanish in translation.

Start with learner-confirmed links. Model-proposed equivalence requires an explicit policy and provenance, not silent identity merging. Do not assign learner concepts the reference graph's IDs or use text matching as universal identity.

## IDs, revisions and provenance

- Internal UUID contracts and upstream `n_...`, `arg_...`, chat/tool-call and notes-source IDs are different namespaces. Validate external references by kind and scope, not a UUID-only schema.
- Keep task targets, expected criteria, learner graph baselines and source excerpts versioned or snapshotted. Store content identity and a human-usable location where available.
- Live upstream IDs support navigation; retained snapshots support historical interpretation. A source/graph edit must not rewrite past evidence.
- Target changes can make prior evidence stale for the current version. Historical success remains historical; do not silently certify revised material.
- Do not depend on automatic extraction for every short lesson. An explicit passage/reference selection can seed learner work before extraction occurs, with its provenance retained.

The current notes-import route converts and extracts content, while notes metadata/graph assertions are not a complete versioned course-document library. Add durable document revisions and page/question/solution roles before relying on it for coursework. Same-name/path-based upstream import identity is not a sufficient new course-document identity policy.

## Attempts and privacy boundaries

See [learning.md](learning.md) for the behavioural contract. Use application-owned actions for start, support exposure, hint request, submission, feedback and assessment. Persist immutable events and a guarded attempt lifecycle, with idempotency for retries and timestamps/condition snapshots at submission.

Separate learner-facing task data from private expected propositions, full solutions and assessor context. Upstream practice puts the committed model solution in native tool arguments and hides it in the UI; that is not automatically a private-answer transport suitable for new independent tasks. Define and test learner-facing projections before claiming stronger isolation.

Scope retention assessors/hint generation to selected target versions and supplied sources. A narrowly constructed, tool-free call is the initial retention direction; do not expose the coding agent's filesystem/shell or inherit all teaching file/research tools by accident. The host's existing file tools can read beyond the data root; they are not a sandbox. Normal upstream teaching remains unchanged unless a stage explicitly changes it.

Schemas validate shape and references, not factual correctness or absence of answer leakage. Assess semantic quality separately. Record uncertain/failed outputs without fabricating success; do not roll back a real hint request because generation failed.

## Cross-store durability and practice bridge

JSON chat writes and SQLite transactions are not atomic together. The practice integration must specify durable-event identity, reconciliation and failure reporting before it is enabled.

The bridge should consume successfully persisted native activity, deduplicate by stable chat/message/tool-call identities and event meaning, and retain enough source identity to retry recovery without rerunning semantic grading arbitrarily. SQLite owns persisted retention assessments; do not regenerate different canonical judgements on every transcript replay.

Test failures before/after each store write, duplicate requests, partial turns, dismissal, abort, reconnect, compaction and restart. Prefer a small explicit reconciliation mechanism over a new distributed queue. Do not capture progress from ephemeral SSE alone or claim delivery because a stream ended.

Old uninstrumented conversations can remain useful context but do not prove unknown assistance/source conditions. No backfill of positive cold-retrieval labels is approved.

## Deletion, backup and lifecycle

Specify reference deletion and export/restore before first real-data use. A deleted upstream source/chat must produce an honest unavailable link or retained snapshot, not a broken foreign-key fiction or silently erased evidence. SQLite cannot enforce foreign keys into JSON files.

Preserve immutable learning history during ordinary graph/source edits. An explicit privacy purge needs a separately specified policy; immutability is not permission to promise that data can never be deleted. Archive/resolution and destructive purge are different operations.

Backups must handle SQLite WAL safely and include associated artefacts plus the relevant upstream records/versions. Keep credentials separate, exclude data and secrets from builds/fixtures, and test restoration into a disposable profile.

## Fork and upstream maintenance

The baseline desktop host still names the application LearnHarness and the builder publishes update metadata for `amosblomqvist/learnharness`. Resolve distinct app/profile identity and a disabled or fork-owned update channel before packaged use with real data. Exact naming and release settings need user approval; this documentation does not change them.

Keep current runtime docs intact and integration changes localised. Review upstream changes to record formats, tool contracts, graph deletion, data paths and providers explicitly. Preserve AGPL licence/attribution. No automated commit, push or release action is authorised by the integration plan.

## Decisions still required

Exact schemas/routes/component labels; driver compatibility; external-reference lifecycle; semantic equivalence/rubric policy; assistance transitions; recovery keys; backup/purge semantics; assessment/recency thresholds; handwritten upload limits; code execution sandbox (if ever added); and fork release identity. Resolve these in the relevant stage, not by treating a proposed diagram as an implemented contract.
