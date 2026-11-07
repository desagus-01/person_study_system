import assert from "node:assert/strict";
import test from "node:test";
import type { LearnerModelLayoutState } from "../src/core/learner-model-layout.ts";
import type { LearnerModelState } from "../src/core/learner-model.ts";
import { emptyStudyContext } from "../src/core/study-context.ts";
import { createLearnerModelHttp, createLearnerModelService } from "../src/server/learner-model.ts";

function fixture() {
	const context = emptyStudyContext();
	context.goals.push({ id: "goal_1", title: "Calculus", createdAt: "t", updatedAt: "t" });
	context.targets.push({ id: "target_1", goalId: "goal_1", text: "Explain derivatives", createdAt: "t", updatedAt: "t" });
	const models = new Map<string, LearnerModelState>();
	const layouts = new Map<string, LearnerModelLayoutState>();
	let id = 0;
	return createLearnerModelHttp(createLearnerModelService({
		studyContextStore: { readStudyContext: () => context, writeStudyContext: () => undefined },
		learnerModelStore: { readLearnerModel: (targetId) => models.get(targetId) ?? null, writeLearnerModel: (model) => { models.set(model.targetId, model); } },
		learnerModelLayoutStore: { readLearnerModelLayout: (targetId) => layouts.get(targetId) ?? null, writeLearnerModelLayout: (layout) => { layouts.set(layout.targetId, layout); } },
		nowIso: () => "2026-11-06T00:00:00.000Z",
		makeId: (prefix) => `${prefix}_${++id}`,
	}));
}

test("learner-model HTTP surface distinguishes missing targets and invalid writes", async () => {
	const http = fixture();
	assert.equal(http.read("missing").status, 404);
	assert.equal(http.change("target_1", { action: "create_concept", label: "" }).status, 400);
	const created = http.change("target_1", { action: "create_concept", label: "Derivative" });
	assert.equal(created.status, 200);
	const model = (await created.json()).model;
	assert.equal(model.currentConceptVersions[0].label, "Derivative");
	assert.equal(http.changeLayout("target_1", { version: 1, targetId: "wrong", positions: [] }).status, 400);
});
