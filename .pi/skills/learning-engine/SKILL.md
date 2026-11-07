---
name: learning-engine
description: Safely change learner graphs, reconstruction, attempts, assistance, assessment evidence, review scheduling, misconceptions or learner summaries in the LearnHarness fork. Use for learning-engine integration or behavioural changes.
---

# Learning-engine changes

All paths below are repository-root-relative. This is coding-agent guidance, not an application teaching/practice prompt.

Before a meaningful change:

1. Read `AGENTS.md` and `docs/README.md`.
2. Check and state the current integration stage in `docs/implementation-plan.md`.
3. Read `docs/learning.md` and `docs/integration-architecture.md`; read `docs/architecture.md` for native sessions/process boundaries and `docs/product.md` for workflow/scope decisions.
4. Inspect the relevant implementation/tests and obtain approval for the concrete slice. Stop for unresolved schemas, thresholds, identity/equivalence policies, assistance semantics or scope changes.

## Preserve the contracts

- Native conversations remain canonical session records. SQLite is the approved future home of course/retention state, not a second chat/reference-graph engine. Verify what exists before describing it as implemented.
- Deterministic operations own identity/versioning, attempt conditions, assistance transitions, scheduling and misconception lifecycle. Models supply validated semantic evidence/proposals, not due dates or opaque mastery scores.
- Keep reference propositions/chains, learner-authored relationships, reconstruction baselines and proposal overlays distinct. Multi-premise entailment is not a set of independent implications.
- UUIDs and upstream graph/chat/tool IDs are distinct namespaces. Validate kind, scope, source provenance and target revision.
- Record exposure/feedback timing and freeze submission conditions. Missing information is unknown, not no assistance. Upstream R0 is help; it is not the original numeric no-help zero. Later feedback does not rewrite earlier conditions.
- Structural map recovery is not automatically correct reasoning; exact-text mismatch is not automatically semantic failure. Keep uncertain equivalence ungraded until policy/evidence supports a conclusion.
- Missing coverage, unreadable writing and ambiguous spans are not confirmed misconceptions. Preserve source-grounded contradictory evidence and reviewed transitions.
- Independent immediate success, delayed retrieval and novel application are different claims. Do not port ever-success logic as a complete current-memory estimate or invent promotion/recency thresholds.
- Private expected answers must not leak through payloads, target labels or inherited tools. Retention calls need bounded context and no accidental filesystem/shell/research access. A valid schema does not prove factual correctness or hint safety.
- SQLite and upstream JSON do not share a transaction. Native practice integration needs durable identities, deduplication, visible failure and reconciliation; SSE alone is not the ledger.
- Recognition uncertainty is distinct from mathematical error. Learner-supplied code execution is distinct from app-verified tests. Do not add arbitrary code execution without a separately approved security design.

## Verify changed behaviour

Add focused node:test cases for the affected contract: lifecycle/exposure ordering, unknown/assisted paths, cross-scope IDs, versions, private-answer projections, retry/restart recovery, omissions/contradictions, semantic ambiguity and model failure as relevant. Use injected models and disposable profiles; never personal corpora or paid calls in automated tests.

Run focused tests, the full type check and relevant project checks from `docs/development.md`; for application changes the normal gates are `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`, plus relevant native/standalone checks. Review the complete diff and record actual results. Update the stage marker only after its exit criteria pass. Commits/pushes require an explicit request.
