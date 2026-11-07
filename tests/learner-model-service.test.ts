import assert from "node:assert/strict";
import test from "node:test";
import { emptyStudyContext } from "../src/core/study-context.ts";
import type { LearnerModelState } from "../src/core/learner-model.ts";
import type { LearnerModelLayoutStore, LearnerModelStore, StudyContextStore } from "../src/core/ports.ts";
import { createLearnerModelService, LearnerModelInputError } from "../src/server/learner-model.ts";

test("learner-model service admits writes only for existing targets", () => {
	const context = emptyStudyContext();
	context.goals.push({ id: "goal_1", title: "Goal", createdAt: "t", updatedAt: "t" });
	context.targets.push({ id: "target_1", goalId: "goal_1", text: "Target", createdAt: "t", updatedAt: "t" });
	const states = new Map<string, LearnerModelState>();
	const layouts = new Map<string, import("../src/core/learner-model-layout.ts").LearnerModelLayoutState>();
	let i = 0;
	const service = createLearnerModelService({
		studyContextStore: { readStudyContext: () => context, writeStudyContext: () => undefined } as StudyContextStore,
		learnerModelStore: {
			readLearnerModel: (targetId) => states.get(targetId) ?? null,
			writeLearnerModel: (state) => { states.set(state.targetId, state); },
		} as LearnerModelStore,
		learnerModelLayoutStore: {
			readLearnerModelLayout: (targetId) => layouts.get(targetId) ?? null,
			writeLearnerModelLayout: (layout) => { layouts.set(layout.targetId, layout); },
		} as LearnerModelLayoutStore,
		nowIso: () => "2026-11-05T00:00:00.000Z",
		makeId: (prefix) => `${prefix}_${++i}`,
	});

	const created = service.change("target_1", { action: "create_concept", label: "Limit" });
	assert.equal(created.currentConceptVersions[0]?.label, "Limit");
	assert.equal(states.get("target_1")?.conceptVersions.length, 1);
	const conceptId = created.currentConceptVersions[0]!.conceptId;
	assert.deepEqual(service.changeLayout("target_1", { version: 1, targetId: "target_1", positions: [{ conceptId, x: 20, y: 30 }] }).positions, [{ conceptId, x: 20, y: 30 }]);
	assert.throws(() => service.changeLayout("target_1", { version: 1, targetId: "target_1", positions: [{ conceptId: "stale", x: 1, y: 2 }] }), /outside/);
	assert.equal(service.readWorkspace("target_1").layout.positions[0]?.conceptId, conceptId);
	assert.throws(() => service.change("target_missing", { action: "create_concept", label: "Nope" }), LearnerModelInputError);
	assert.throws(() => service.change("target_1", { action: "create_concept", label: "" }), LearnerModelInputError);
});
