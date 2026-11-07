---
description: Plan a focused fork integration change without modifying files
argument-hint: "<requested outcome>"
---
Plan this work: $@

Do not modify files, install dependencies, run migrations or make model requests during planning. Read AGENTS.md and docs/README.md, check and state the current integration stage in docs/implementation-plan.md, then inspect relevant existing code, working-tree changes, dependencies and tests.

Distinguish current LearnHarness runtime from approved future course/retention design. Identify the smallest coherent slice, likely affected files, data/API implications, verification, risks and unresolved decisions. Follow docs/architecture.md and docs/integration-architecture.md; do not transplant the original Electron/IPC stack or separate Pi runtime. Ask structured questions for material ambiguity, then obtain approval before implementation. Keep the plan concrete and concise; do not silently advance stages or treat upstream historical plans as the active roadmap.
