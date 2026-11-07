import assert from "node:assert/strict";
import test from "node:test";
import {
	emptyLearnerModelLayout,
	parseLearnerModelLayout,
	sanitizeLearnerModelLayout,
} from "../src/core/learner-model-layout.ts";

test("learner-model layout is target-scoped finite presentation state", () => {
	assert.deepEqual(emptyLearnerModelLayout("target_1"), { version: 1, targetId: "target_1", positions: [] });
	const layout = parseLearnerModelLayout({
		version: 1,
		targetId: "target_1",
		positions: [{ conceptId: "concept_1", x: 12.5, y: -4 }],
	});
	assert.equal(layout.positions[0]?.x, 12.5);
	assert.throws(() => parseLearnerModelLayout({ version: 1, targetId: "target_1", positions: [{ conceptId: "concept_1", x: Infinity, y: 0 }] }), /finite/);
	assert.throws(() => parseLearnerModelLayout({ version: 1, targetId: "target_1", positions: [{ conceptId: "concept_1", x: 0, y: 0 }, { conceptId: "concept_1", x: 1, y: 1 }] }), /already exists/);
});

test("layout sanitizing rejects cross-model concepts without changing semantic identity", () => {
	const layout = sanitizeLearnerModelLayout({
		version: 1,
		targetId: "target_1",
		positions: [{ conceptId: "concept_current", x: 1, y: 2 }],
	}, "target_1", new Set(["concept_current"]));
	assert.deepEqual(layout.positions, [{ conceptId: "concept_current", x: 1, y: 2 }]);
	assert.throws(() => sanitizeLearnerModelLayout({ version: 1, targetId: "target_1", positions: [{ conceptId: "concept_stale", x: 3, y: 4 }] }, "target_1", new Set(["concept_current"])), /outside/);
	assert.throws(() => sanitizeLearnerModelLayout({ version: 1, targetId: "other", positions: [] }, "target_1", new Set()), /does not match/);
});
