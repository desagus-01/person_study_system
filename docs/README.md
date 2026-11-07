# Documentation index

Status: current documentation routing and authority guide.

## Start here

This fork retains LearnHarness's teaching/practice application and adds an approved direction for course-aware, learner-owned organisation and long-term retention. New documentation is not evidence that new features have shipped.

| Document | Authority / purpose |
|---|---|
| [Product](product.md) | Approved product direction, scope and non-goals |
| [Learning framework](learning.md) | Approved learning/evidence principles; research and provisional policies are labelled separately |
| [Integration architecture](integration-architecture.md) | Approved subsystem boundaries; proposed structures and unresolved implementation decisions |
| [Integration implementation plan](implementation-plan.md) | Active integration stages, current stage, exit criteria and verification record |
| [Runtime architecture](architecture.md) | Current LearnHarness runtime reference; confirm details against code |
| [Development](development.md) | Current commands, configuration, isolation and check prerequisites |

Read the index, check the integration stage, then choose the smallest relevant set below. If a decision is still unresolved, ask before implementing it.

## Task routing

| Task | Read first |
|---|---|
| Scope, course goals, personal technical goals | [product.md](product.md) |
| Implementation sequencing or migration/reuse | [implementation-plan.md](implementation-plan.md) |
| Storage, process boundaries, external IDs, deletion/recovery | [integration-architecture.md](integration-architecture.md), [architecture.md](architecture.md) |
| Learner maps, reference graphs, reconstruction | [learning.md](learning.md), [integration-architecture.md](integration-architecture.md) |
| Attempts, hints, feedback exposure, review, misconceptions | [learning.md](learning.md), [integration-architecture.md](integration-architecture.md) |
| Learning UI, handwriting or external coding work | [product.md](product.md), [learning.md](learning.md) |
| Assessment validation, evaluation and research rationale | [learning.md](learning.md) |
| Runtime agent tools or prompt changes | [architecture.md](architecture.md), [prompt composition](../src/agent/prompts/README.md), actual registries and schemas |
| Coding-agent workflow resources | [AGENTS.md](../AGENTS.md), relevant `.pi/skills/` or `.pi/prompts/` file |
| Development, profiles, credentials or tests | [development.md](development.md) |
| Desktop packaging, identity or updater | [desktop-release.md](desktop-release.md), [architecture.md](architecture.md), actual desktop configuration/tests |
| Providers / context accounting | [custom-providers.md](custom-providers.md), [claude-code.md](claude-code.md), [compaction-accounting.md](compaction-accounting.md), as relevant |

## Status and conflict rules

- **Current implementation:** runtime behaviour described by the existing references and verified against code/tests. Code/document discrepancies require investigation, not silent assumptions.
- **Approved direction:** decisions for this fork; permission to design within these boundaries, not proof of implementation or permission to skip a stage's approval/checks.
- **Proposed / provisional:** candidates requiring an explicit decision or verification before becoming enforced behaviour. Proposed tables, filenames and pedagogical thresholds are not established contracts.
- **Historical / research background:** context, not an active build specification. Research supports particular practices under particular conditions, not every product policy.

The current runtime and intended extension coexist: conversations are canonical session records; the planned structured evidence subsystem owns retention state. A future architectural change must update the relevant references explicitly.

## Upstream theory and history

[teaching-methodology.md](teaching-methodology.md) documents the upstream teaching theory, not experimental validation of all its claims. Existing runtime prompts remain unchanged by the documentation migration. For the fork's intended learning behaviour and evidence limitations, use [learning.md](learning.md).

[plan.md](plan.md), [vision.md](vision.md), [pi-engine-swap.md](pi-engine-swap.md), release notes and [archive/](archive/) preserve upstream design history. They are **not this fork's active roadmap**, and portions describe retired implementations. Do not implement old proposals merely because they appear there.

No copies of the original project's uppercase documentation or full research archive are required to work in this fork. Relevant principles and research links are adapted into the focused documents above.
