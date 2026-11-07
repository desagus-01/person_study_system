# Product direction

Status: approved direction for the fork; additions below are not implemented unless the integration plan records verified completion.

Related: [learning framework](learning.md), [integration boundaries](integration-architecture.md), [implementation plan](implementation-plan.md). Current runtime: [architecture.md](architecture.md).

## Purpose

A course- and goal-aware technical learning environment that connects guided explanations, learner-owned organisation, handwritten problem solving, external coding work and long-term retention.

Problems and projects are the organising spine. Learner graphs expose reusable relationships; independent activity establishes what the learner can retrieve and use. LearnHarness supplies the existing teaching and conversational practice experience rather than being replaced by a second application.

## Two entry points

### Classes

Use syllabuses, lectures, problem sheets, past exams and worked solutions/rubrics to propose observable capabilities. Distinguish their roles:

- Syllabus: required scope and intended outcomes.
- Lectures: definitions, notation, assumptions and methods used by the course.
- Problem sheets: reasoning/procedural demands and opportunities to practise.
- Past exams: representative formats and integration demands, not an exhaustive curriculum.
- Solutions/rubrics: reference reasoning and marking expectations, separate from learner-facing questions.

AI-generated course organisation and target links require learner confirmation and provenance. A curriculum map is not the learner's own model. Syllabus coverage is not demonstrated competence.

### Self-directed technical learning

Refine a broad interest into a bounded goal with a mathematical demonstration, a practical artefact and an independent check. For example: derive gradient descent, perform iterations by hand, implement it externally, and explain step-size behaviour on simple examples.

Probe prerequisites and teach what is needed for the goal. Do not turn a bounded objective into an endless prerequisite course. Allow entry through a topic, source, existing problem or project.

## Connected activities

1. Establish a goal and relevant starting knowledge.
2. Teach unfamiliar material and check reasoning with appropriate support.
3. Invite the learner to organise important relationships or explain why a method works.
4. Retrieve, reconstruct, derive or solve with less support.
5. Practise discrimination, composition and changed representations.
6. Revisit important targets after delays; use evidence to select targeted repair.

These are activities, not a compulsory linear wizard. Preserve teaching and practice as independently usable modes. A session can move between explanation and work, but the system must record when support changes.

## Workspace principles

- Teaching may foreground conversation, explanations and examples.
- Mapping/reconstruction foregrounds the learner's artefact; problem solving foregrounds the task and working.
- Do not force a map after every teaching step or problem. Ask for organisation where it reveals reusable structure.
- The learner retains ownership of their model. AI suggestions are noncanonical until explicitly accepted through validated operations.
- Keep course structure, reference knowledge, learner models and behavioural evidence distinct even when the UI links them.
- Reduce logistics without outsourcing meaningful cognitive work. Finding a source is logistics; deciding why two ideas connect can itself be learning.

## Mathematics and code

Support paper/tablet and existing editors, notebooks and terminals. The initial direction is selected submissions and artefact links, not a built-in IDE or live handwriting stream.

Track mathematical explanation, derivation, by-hand calculation, method selection, implementation, debugging and interpretation separately. Bridge tasks connect them: predict output, implement a small hand-solved case, explain a code step, compare analytical/numerical results, or investigate a boundary case.

Executing a library call is not evidence of deriving the method; a hand calculation is not evidence of implementing it reliably. Learner-supplied outputs and application-observed execution must be labelled distinctly.

## First useful milestone

One goal linked to a teaching session, a small learner-owned model, an unsupported reconstruction/explanation attempt, bounded feedback and a persisted later review. This must work before course-document automation or advanced handwritten/code assessment is expanded.

## Approved constraints and non-goals

- Preserve upstream chat/graph/settings stores; add a dedicated SQLite course/retention subsystem beneath the existing data-root seam.
- Reuse original code, tests and ideas selectively; begin with fresh learning data. No legacy-data importer is in the current scope.
- No replacement Electron/preload/IPC stack, second provider configuration system, or wholesale repository merge.
- No opaque mastery percentage, AI-owned scheduling, automatic canonical learner maps, or inference of retention from teaching completion.
- No mandatory map for every activity, integrated IDE, arbitrary uploaded-code execution, live visual capture, or multi-user hosting in the initial integration.
- Preserve upstream licence and attribution. Do not change runtime prompts, release identity or update configuration merely by documenting future behaviour.

## Deferred decisions

Exact UI labels/navigation, detailed schemas, SQLite driver compatibility, workload limits, assessment thresholds, semantic-equivalence policy and release identity require stage-specific decisions/verification. This document does not choose them implicitly.
