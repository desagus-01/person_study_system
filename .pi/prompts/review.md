---
description: Review the fork's current changes for substantive correctness and integration risks
argument-hint: "[focus]"
---
Review the current changes. Optional focus: $@

Do not modify files during review. Read AGENTS.md and docs/README.md, check the current integration stage and inspect the complete diff including untracked files. Prioritise correctness, regressions, security, unnecessary complexity/dependencies, missing tests and deviations from approved scope over formatting trivia.

For application changes, check the import/barrel law, native session ownership, SQLite/JSON consistency and retry recovery, graph/ID/version boundaries, private-answer and credential exposure, assistance timing, model-assessed versus deterministic state, compatibility and fork profile/update safety. Do not assume planned features exist or historical tests verify this tree.

For docs/skills/templates, check links, paths, commands, frontmatter, stale stage/IPC assumptions, status/authority conflicts and confusion with runtime tutor prompts. Report findings by severity with file references, distinguish verified failures from unverified risks, and state when no substantive problems were found. Never claim unrun tests passed or commit/push as part of a review.
