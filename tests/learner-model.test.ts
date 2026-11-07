import assert from "node:assert/strict";
import test from "node:test";
import {
	applyLearnerModelWrite,
	emptyLearnerModel,
	parseLearnerModelWrite,
	projectLearnerModel,
	projectLearnerModelReferences,
} from "../src/core/learner-model.ts";

function deps() {
	let id = 0;
	return {
		nowIso: () => "2026-11-05T00:00:00.000Z",
		makeId: (prefix: "concept" | "concept_version" | "relationship" | "relationship_version") => `${prefix}_${++id}`,
	};
}

test("learner model keeps immutable concept and relationship version lineages", () => {
	const d = deps();
	let state = emptyLearnerModel("target_1", "2026-11-05T00:00:00.000Z");
	state = applyLearnerModelWrite(state, { action: "create_concept", label: "Derivative" }, d);
	state = applyLearnerModelWrite(state, { action: "create_concept", label: "Rate of change" }, d);
	const [derivative, rate] = state.conceptVersions;
	assert.ok(derivative && rate);
	state = applyLearnerModelWrite(state, {
		action: "create_relationship",
		sourceConceptVersionId: derivative.id,
		targetConceptVersionId: rate.id,
		propositionLabel: "A derivative describes instantaneous rate of change.",
		sourceLinks: [{ kind: "graph_node", refId: "n_derivative", refSnapshot: { excerpt: "rate" } }],
	}, d);
	state = applyLearnerModelWrite(state, { action: "revise_concept", conceptId: derivative.conceptId, label: "Derivative at a point" }, d);
	const revisedDerivative = state.conceptVersions.at(-1)!;
	const relationship = state.relationships[0]!;
	state = applyLearnerModelWrite(state, {
		action: "revise_relationship",
		relationshipId: relationship.id,
		sourceConceptVersionId: revisedDerivative.id,
		targetConceptVersionId: rate.id,
		propositionLabel: "The derivative at a point is an instantaneous rate of change.",
		sourceLinks: [{ kind: "graph_chain", refId: "arg_derivative" }],
	}, d);

	const view = projectLearnerModel(state);
	assert.equal(state.conceptVersions.length, 3);
	assert.equal(state.relationshipVersions.length, 2);
	assert.equal(view.currentConceptVersions.find((version) => version.conceptId === derivative.conceptId)?.label, "Derivative at a point");
	assert.equal(view.currentRelationshipVersions[0]?.propositionLabel, "The derivative at a point is an instantaneous rate of change.");
	assert.equal(state.relationshipVersions[1]?.supersedesId, state.relationshipVersions[0]?.id);
});

test("learner model rejects invalid relationship endpoints and duplicate source links", () => {
	const d = deps();
	let state = emptyLearnerModel("target_1", "t");
	state = applyLearnerModelWrite(state, { action: "create_concept", label: "A" }, d);
	assert.throws(() => applyLearnerModelWrite(state, {
		action: "create_relationship", sourceConceptVersionId: "missing", targetConceptVersionId: "missing", propositionLabel: "A implies B",
	}, d), /endpoints/);
	assert.throws(() => parseLearnerModelWrite({
		action: "create_relationship", sourceConceptVersionId: "cv_a", targetConceptVersionId: "cv_b", propositionLabel: "A implies B",
		sourceLinks: [{ kind: "graph_node", refId: "n_1" }, { kind: "graph_node", refId: "n_1" }],
	}), /already exists/);
});

test("reference projection reports unavailable provenance without deleting it", () => {
	const d = deps();
	let state = emptyLearnerModel("target_1", "t");
	state = applyLearnerModelWrite(state, { action: "create_concept", label: "A" }, d);
	state = applyLearnerModelWrite(state, { action: "create_concept", label: "B" }, d);
	state = applyLearnerModelWrite(state, {
		action: "create_relationship", sourceConceptVersionId: state.conceptVersions[0]!.id, targetConceptVersionId: state.conceptVersions[1]!.id,
		propositionLabel: "A supports B", sourceLinks: [{ kind: "notes_source", refId: "src_missing" }],
	}, d);
	const view = projectLearnerModelReferences(state, { graphNodeIds: new Set(), graphChainIds: new Set(), notesSourceIds: new Set() });
	assert.equal(view.currentRelationshipVersions[0]?.sourceLinks[0]?.status, "unresolved");
	assert.equal(state.relationshipVersions[0]?.sourceLinks[0]?.refId, "src_missing");
});
