# Learning framework and evidence

Status: approved fork principles for future implementation. Existing runtime prompts and tools retain their current behaviour until separately changed and tested. Research findings and provisional policies below are not claims that this combined workflow has been validated.

Related: [product](product.md), [integration boundaries](integration-architecture.md), [implementation plan](implementation-plan.md).

## Core distinctions

- Understanding an explanation, organising relationships, retrieving later and applying in a new situation are related but different achievements.
- Immediate correctness and the feeling that an idea is obvious are useful signals, not proof of durable learning.
- Source-visible organisation is primarily encoding/elaboration. Source-hidden reconstruction is retrieval evidence under its recorded conditions, not automatically evidence of correctness or transfer.
- Correctness and independence are separate dimensions. Assisted success can be productive remediation without demonstrating unaided performance.
- A curriculum plan describes intended work; an extracted graph describes reference claims; a learner map describes the learner's organisation; attempts record observable behaviour.
- Missing coverage is not a misconception. Model diagnosis remains uncertain, source-grounded evidence, not direct access to mental state.

## Learning activities and transitions

### Guided understanding

Retain LearnHarness's goal probing, prerequisite-sensitive explanations, examples, checks and thinking traces. Explain genuinely unfamiliar material rather than forcing fake Socratic discovery. Guidance can fade through worked examples, step completion and independent problems.

An immediate successful check may justify moving forward in the lesson; it does not certify future recall. The upstream teaching theory's emphasis on a proposition feeling obviously true is a teaching aim, not a sufficient retention criterion.

### Learner-generated organisation

Ask for important relationships in the learner's own words: why a result follows, how a procedure applies, which assumption is necessary, or what distinguishes alternatives. Concepts and labelled relationships are useful representations; explanations or derivations may sometimes be better.

Do not automatically copy the reference graph into the learner model. Proposals stay separate until accepted. Do not require a graph after every question, or equate accepting a suggestion with independently generating it.

### Retrieval and reconstruction

Useful tasks include free recall, relationship explanation, small-map reconstruction, derivation reconstruction, example generation and boundary cases. Start an attempt before exposing support, retain an immutable task/baseline, and preserve the response before feedback.

Report structural recovery separately from semantic correctness. Recovering an incorrect prior map does not make it correct. Exact-text comparison cannot establish semantic equivalence; uncertain paraphrases or alternative reasoning need a validated assessment or review rather than a silent fail/pass.

### Discrimination and application

Retain and connect upstream recall/discrimination/composition practice. Use tasks that require choosing methods without naming the answer in the question, heading or visible target list. Interleave meaningful alternatives when appropriate; random unrelated shuffling is not the objective.

Reconstructing a relationship does not prove novel application. Record explanation, derivation, hand calculation, method selection, implementation, debugging and interpretation as distinct evidence dimensions rather than assuming a single linear competence ladder.

### Delayed revisiting and targeted repair

Schedule important targets, not every extracted sentence. Review may be an explanation, reconstruction, derivation or problem. Select repair based on evidence: a cue miss, method-selection error, execution slip and incorrect relationship need different activities.

Instruction may be necessary during practice. Make that change explicit and schedule a later independent opportunity; do not insist that every difficulty can be repaired by a tiny hint. Preserve learner control to end or change activity.

## Attempt conditions

The deterministic subsystem must record support and feedback timing, not infer it from the final answer or the model's concluding label.

At submission, establish whether the response preceded feedback and whether sources, reference/answer material or assistance had been exposed beforehand. Record hints requested/delivered, answer reveal, relevant timestamps and declared external help. Conditions do not reset by closing a panel, refreshing or reconnecting.

A candidate for unaided retrieval evidence requires all of:

- a submitted response before feedback;
- no relevant source/reference material exposed during the attempt before submission;
- no answer exposure before submission;
- no assistance before submission;
- sufficient condition information, rather than unknown support being treated as absent.

Call the operational no-support classification `cold retrieval` only with its limitations visible. It cannot prove that an external source was not consulted. Distinguish app-observed conditions from learner declarations. Record recent teaching/review context so an immediate unsupported answer is not represented as equivalent to delayed retrieval. No universal delay threshold is approved yet.

Freeze pre-submission conditions: feedback delivered afterward must not retroactively contaminate a previously independent response. Feedback exposure needs its own record; absence of full answer reveal alone does not prove absence of earlier evaluative help.

Upstream `R0` is an attention-redirect hint, not zero assistance. Do not equate it with the original app's numeric zero. Preserve whether any help occurred separately from descriptions of how revealing it was. A schema-valid level label cannot by itself prove the hint did not leak an answer; evaluate hint quality separately.

## Assessment and coaching

Use bounded, target-specific context with versioned expected propositions/criteria and source references. Keep expected answers and full solutions out of learner-facing task payloads before permitted reveal. Do not assume UI-hidden transcript fields provide a private-answer boundary.

Separate diagnosis from pedagogical response where it helps validation: first assess supplied evidence, validate identities/coverage/spans, then coach from that result. Reject unknown/cross-scope IDs, missing required judgements and unsupported source references. Ambiguous or insufficient evidence remains ungradable/uncertain, not automatically wrong or sound.

Record model identity, prompt/contract version, deterministic input identity, outcome and validated output or sanitised failure. Failed model calls preserve the learner's submitted work. Use injectable models for tests. Models do not assign due dates, capability states or canonical misconception transitions.

## Handwritten mathematics and external code

Preserve the original submitted artefact. Recognition uncertainty is not a mathematical error. Let the learner correct uncertain transcription before strong conclusions; distinguish a transcription correction from revising the mathematical response.

Assess assumptions, method, load-bearing steps and execution; accept valid alternative solutions where supported. Locate the earliest consequential break only when the working makes that inference defensible. Do not demand full transcription merely to request a hint.

For code, collect selected code, outputs, tests, plots and explanations from existing tools. Distinguish what the app verified from learner-supplied execution claims. Do not claim tests passed merely because code looks plausible. Automatic arbitrary code execution requires a separately approved sandbox/security design.

## Review policy and learner summaries

The original `1 → 3 → 7 → 14 → 30 → 60` day ladder is a provisional baseline to adapt and test, not an empirically optimal schedule. Preserve its useful rule that supported independent success and assisted remediation are not interchangeable. Decide detailed promotion/reset and workload policies explicitly before implementation.

Display evidence-backed descriptions and dates, not an opaque mastery percentage. Historical success, current retrievability and transfer are different claims. Target revisions and contradictory later evidence must be visible; do not let an old success certify changed material indefinitely.

Exact capability promotion, delay, fluency, transfer and automatic misconception thresholds remain unresolved. The original capability enum/ever-success implementation is a reuse candidate, not an approved complete learner model.

## Misconception safeguards

- An omission, unreadable symbol or ambiguous explanation does not establish a misconception.
- A candidate needs a specific contradictory learner span tied to an assessed proposition and source context.
- Confirmation/resolution/recurrence are backend-validated transitions with explicit evidence and review policy, not model commands.
- Use cautious candidate wording and a discriminating follow-up when needed.
- Preserve occurrence/transition history. Do not invent repeated-evidence thresholds or automatically confirm every structural practice miss.

## Evaluation

Primary outcomes are delayed independent explanation/relationship recovery, unlabelled method selection, novel application and assistance trends relative to time/effort. Teaching completion, attractive maps, engagement and supported within-session correctness are not substitutes.

Validate proposition-level diagnosis, contradiction false positives, hint leakage and feedback faithfulness against human-reviewed examples. Keep a small gold set with ambiguous/ungradable and valid alternative responses. Automated fixtures verify contracts, not educational efficacy.

For personal evaluation, compare matched topics or alternate conditions with approximate time and initial difficulty controlled. Compare the combined workflow with LearnHarness teaching/practice alone, not just passive rereading. Separate learning gain from the additional time spent mapping. No research below proves this specific combined system or its exact thresholds work.

## Research rationale and limits

These references were identified during the integration research discussion; retain the stated scope and consult the papers before making stronger claims.

- [Soderstrom & Bjork (2015), Learning Versus Performance](https://doi.org/10.1177/1745691615569000): acquisition performance can diverge from delayed retention/transfer. Immediate ease is not a reliable completion criterion.
- [Schroeder et al. (2018), concept-map meta-analysis](https://doi.org/10.1007/s10648-017-9403-9): supports concept/knowledge mapping across studied comparisons. Construction/study moderator differences do not establish that constructing maps always beats every alternative.
- [Karpicke & Blunt (2011), retrieval versus elaborative mapping](https://doi.org/10.1126/science.1199327): retrieval improved meaningful learning in the studied science-text tasks; source-visible mapping is not a substitute for retrieval.
- [Blunt & Karpicke (2014), retrieval-based concept mapping](https://doi.org/10.1037/a0035934): retrieval-based maps and paragraph recall both benefited delayed tests; no difference between those retrieval formats was found. Graphs need not be mandatory.
- [Bisra et al. (2018), self-explanation meta-analysis](https://doi.org/10.1007/s10648-018-9434-x): supports prompts that elicit causal/conceptual inferences across studied conditions, not mere transcription or any particular AI feedback design.
- [Atkinson, Renkl & Merrill (2003), fading and self-explanation](https://eric.ed.gov/?id=EJ678596): supports a guided transition from worked steps to problem solving in the studied tasks, not an invariant progression for all expertise levels.
- [Rawson, Dunlosky & Sciartelli (2013), successive relearning](https://doi.org/10.1007/s10648-013-9240-4): supports combining successful retrieval with revisiting across days; does not validate the proposed interval ladder for every target.
- [Rohrer et al. (2020), interleaved mathematics practice](https://eric.ed.gov/?id=EJ1237752): classroom evidence for interleaving in the studied mathematics setting, not universal maximal mixing from the first novice example.
- [Bastani et al. (2025), generative AI guardrails](https://doi.org/10.1073/pnas.2422633122): supported performance and later unaided performance differed with tool design in a high-school maths experiment. This motivates independent evaluation; it does not evaluate either repository.

Learner-generated organisation and iCanStudy/Justin Sung material informed the original project's design. Treat a branded programme as inspiration rather than an independently validated package. Do not import its full archive or claims as this fork's specification.
