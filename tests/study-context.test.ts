import assert from "node:assert/strict";
import test from "node:test";
import {
	emptyStudyContext,
	parseStudyContext,
	parseStudyContextWrite,
	applyStudyContextWrite,
	projectStudyContext,
} from "../src/core/study-context.ts";

function makeDeps() {
	let i = 0;
	return {
		nowIso: () => "2026-11-04T00:00:00.000Z",
		makeId: (_prefix: "goal" | "target" | "link") => `id_${++i}`,
	};
}

test("parseStudyContextWrite accepts the approved create actions", () => {
	assert.deepEqual(parseStudyContextWrite({ action: "create_goal", title: "Linear algebra" }), { action: "create_goal", title: "Linear algebra" });
	assert.deepEqual(parseStudyContextWrite({ action: "create_target", goalId: "goal_1", text: "Understand eigenvectors" }), { action: "create_target", goalId: "goal_1", text: "Understand eigenvectors" });
	assert.deepEqual(
		parseStudyContextWrite({ action: "create_reference_link", targetId: "target_1", kind: "graph_node", refId: "n_abc", refSnapshot: { source: "lesson_1", excerpt: [1, 2, 3] } }),
		{ action: "create_reference_link", targetId: "target_1", kind: "graph_node", refId: "n_abc", refSnapshot: { source: "lesson_1", excerpt: [1, 2, 3] } },
	);
});

test("create_goal and create_target produce deterministic state with injected deps", () => {
	const deps = makeDeps();
	let state = emptyStudyContext();
	state = applyStudyContextWrite(state, { action: "create_goal", title: "Calculus" }, deps);
	assert.equal(state.goals.length, 1);
	assert.equal(state.goals[0]?.id, "id_1");
	assert.equal(state.goals[0]?.createdAt, "2026-11-04T00:00:00.000Z");

	state = applyStudyContextWrite(state, { action: "create_target", goalId: "id_1", text: "Derive product rule" }, deps);
	assert.equal(state.targets.length, 1);
	assert.equal(state.targets[0]?.id, "id_2");
	assert.equal(state.targets[0]?.goalId, "id_1");
});

test("create_target rejects unknown goals", () => {
	const deps = makeDeps();
	assert.throws(() => applyStudyContextWrite(emptyStudyContext(), { action: "create_target", goalId: "missing", text: "x" }, deps), /Goal no longer exists/);
});

test("create_reference_link enforces known targets and duplicate rejection", () => {
	const deps = makeDeps();
	let state = emptyStudyContext();
	state = applyStudyContextWrite(state, { action: "create_goal", title: "Probability" }, deps);
	state = applyStudyContextWrite(state, { action: "create_target", goalId: "id_1", text: "Bayes theorem" }, deps);
	assert.throws(() => applyStudyContextWrite(state, { action: "create_reference_link", targetId: "missing", kind: "graph_node", refId: "n_1" }, deps), /Target no longer exists/);

	state = applyStudyContextWrite(state, { action: "create_reference_link", targetId: "id_2", kind: "graph_node", refId: "n_1", refSnapshot: { note: "first" } }, deps);
	assert.equal(state.links.length, 1);
	assert.deepEqual(state.links[0]?.refSnapshot, { note: "first" });
	assert.throws(() => applyStudyContextWrite(state, { action: "create_reference_link", targetId: "id_2", kind: "graph_node", refId: "n_1" }, deps), /already exists/);
});

test("parseStudyContext rejects invalid link kinds", () => {
	const invalid: unknown = {
		version: 1,
		goals: [{ id: "goal_1", title: "G", createdAt: "t", updatedAt: "t" }],
		targets: [{ id: "target_1", goalId: "goal_1", text: "T", createdAt: "t", updatedAt: "t" }],
		links: [{ id: "link_1", targetId: "target_1", kind: "chat_message", refId: "m_1", createdAt: "t" }],
	};
	assert.throws(() => parseStudyContext(invalid), /Invalid link record/);
});

test("parseStudyContextWrite rejects non-JSON snapshots", () => {
	assert.throws(
		() => parseStudyContextWrite({ action: "create_reference_link", targetId: "target_1", kind: "graph_node", refId: "n_1", refSnapshot: { bad: Number.NaN } }),
		/refSnapshot must be valid JSON/,
	);
});

test("projectStudyContext marks missing references as unresolved without deleting links", () => {
	const state = parseStudyContext({
		version: 1,
		goals: [{ id: "goal_1", title: "G", createdAt: "t", updatedAt: "t" }],
		targets: [{ id: "target_1", goalId: "goal_1", text: "T", createdAt: "t", updatedAt: "t" }],
		links: [
			{ id: "link_1", targetId: "target_1", kind: "graph_node", refId: "n_present", createdAt: "t" },
			{ id: "link_2", targetId: "target_1", kind: "notes_source", refId: "missing_notes", createdAt: "t" },
		],
	});
	const projected = projectStudyContext(state, {
		graphNodeIds: new Set(["n_present"]),
		graphChainIds: new Set(),
		notesSourceIds: new Set(["notes_ok"]),
	});
	assert.equal(projected.links.length, 2);
	assert.equal(projected.links[0]?.status, "resolved");
	assert.equal(projected.links[1]?.status, "unresolved");
	assert.equal(projected.links[1]?.id, "link_2");
});
