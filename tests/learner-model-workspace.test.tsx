import React from "react";
(globalThis as Record<string, unknown>).React = React;
import assert from "node:assert/strict";
import test from "node:test";
import { learnerModelElements } from "../components/learner-model-workspace.tsx";
import type { LearnerModelView } from "../src/core/learner-model.ts";

const model: LearnerModelView = {
	version: 1,
	targetId: "target_1",
	createdAt: "t",
	concepts: [{ id: "concept_a", createdAt: "t" }, { id: "concept_b", createdAt: "t" }],
	conceptVersions: [
		{ id: "version_a1", conceptId: "concept_a", label: "Derivative", supersedesId: null, createdAt: "t" },
		{ id: "version_b1", conceptId: "concept_b", label: "Rate", supersedesId: null, createdAt: "t" },
		{ id: "version_a2", conceptId: "concept_a", label: "Derivative at a point", supersedesId: "version_a1", createdAt: "t2" },
	],
	relationships: [{ id: "relationship_1", createdAt: "t" }],
	relationshipVersions: [{ id: "relationship_version_1", relationshipId: "relationship_1", sourceConceptVersionId: "version_a2", targetConceptVersionId: "version_b1", propositionLabel: "is an instantaneous", supersedesId: null, createdAt: "t", sourceLinks: [] }],
	currentConceptVersions: [
		{ id: "version_a2", conceptId: "concept_a", label: "Derivative at a point", supersedesId: "version_a1", createdAt: "t2" },
		{ id: "version_b1", conceptId: "concept_b", label: "Rate", supersedesId: null, createdAt: "t" },
	],
	currentRelationshipVersions: [{ id: "relationship_version_1", relationshipId: "relationship_1", sourceConceptVersionId: "version_a2", targetConceptVersionId: "version_b1", propositionLabel: "is an instantaneous", supersedesId: null, createdAt: "t", sourceLinks: [] }],
};

test("workspace projection uses stable concept IDs for layout and current semantic labels", () => {
	const elements = learnerModelElements(model, { version: 1, targetId: "target_1", positions: [{ conceptId: "concept_a", x: 400, y: 220 }] });
	assert.deepEqual(elements.nodes.find((node) => node.id === "concept_a")?.position, { x: 400, y: 220 });
	assert.equal(elements.nodes.find((node) => node.id === "concept_a")?.data.label, "Derivative at a point");
	assert.equal(elements.edges[0]?.source, "concept_a");
	assert.equal(elements.edges[0]?.target, "concept_b");
	assert.equal(elements.edges[0]?.label, "is an instantaneous");
});
