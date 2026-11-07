---
description: Diagnose a fork failure from evidence and propose the smallest verified fix
argument-hint: "<problem>"
---
Debug: $@

Read AGENTS.md and docs/README.md, check the current integration stage, inspect working-tree changes and relevant implementation/tests, and reproduce the failure safely. Use docs/development.md to isolate data/auth; inspect test setup before running code that may write a profile or use ambient credentials. Do not use paid models or personal data without explicit approval.

Capture the actual error and trace its cause before proposing changes. Distinguish native conversation/provider failures from the new retention subsystem, including cross-store partial writes and replay/retry behaviour where relevant. Do not hide failures with speculative rewrites, mocks or invented results. Explain the smallest fix and verification, resolve ambiguity and obtain approval before editing. Add an appropriate regression test, run focused and relevant full checks, review the diff, and report actual results and limitations. Do not commit or push unless asked.
