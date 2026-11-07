import assert from "node:assert/strict";
import test from "node:test";
import { emptyStudyContext } from "../src/core/study-context.ts";
import type { LearnerModelState } from "../src/core/learner-model.ts";
import type { LearnerModelStore, StudyContextStore } from "../src/core/ports.ts";
import { createLearnerModelService, LearnerModelInputError } from "../src/server/learner-model.ts";

test("learner-model service admits writes only for existing targets", () => {
	const context = emptyStudyContext();
	context.goals.push({ id: "goal_1", title: "Goal", createdAt: "t", updatedAt: "t" });
	context.targets.push({ id: "target_1", goalId: "goal_1", text: "Target", createdAt: "t", updatedAt: "t" });
	const states = new Map<string, LearnerModelState>();
	let i = 0;
	const service = createLearnerModelService({
		studyContextStore: { readStudyContext: () => context, writeStudyContext: () => undefined } as StudyContextStore,
		learnerModelStore: {
			readLearnerModel: (targetId) => states.get(targetId) ?? null,
			writeLearnerModel: (state) => { states.set(state.targetId, state); },
		} as LearnerModelStore,
		nowIso: () => "2026-11-05T00:00:00.000Z",
		makeId: (prefix) => `${prefix}_${++i}`,
	});

	const created = service.change("target_1", { action: "create_concept", label: "Limit" });
	assert.equal(created.currentConceptVersions[0]?.label, "Limit");
	assert.equal(states.get("target_1")?.conceptVersions.length, 1);
	assert.throws(() => service.change("target_missing", { action: "create_concept", label: "Nope" }), LearnerModelInputError);
	assert.throws(() => service.change("target_1", { action: "create_concept", label: "" }), LearnerModelInputError);
});
