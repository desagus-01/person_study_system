import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { emptyStudyContext } from "../src/core/study-context.ts";
import { createStudyContextStore } from "../src/store/study-context.ts";

function tempDb() {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), "lh-learner-model-store-"));
	return { file: path.join(directory, "learning.sqlite"), cleanup: () => fs.rmSync(directory, { recursive: true, force: true }) };
}

test("learner model store migrates, reopens, and retains versioned provenance", () => {
	const temp = tempDb();
	try {
		const store = createStudyContextStore(temp.file);
		const context = emptyStudyContext();
		context.goals.push({ id: "goal_1", title: "Calculus", createdAt: "t", updatedAt: "t" });
		context.targets.push({ id: "target_1", goalId: "goal_1", text: "Derivatives", createdAt: "t", updatedAt: "t" });
		store.writeStudyContext(context);
		const model = {
			version: 1 as const,
			targetId: "target_1",
			createdAt: "t",
			concepts: [{ id: "concept_1", createdAt: "t" }, { id: "concept_2", createdAt: "t" }],
			conceptVersions: [
				{ id: "concept_version_1", conceptId: "concept_1", label: "Derivative", supersedesId: null, createdAt: "t" },
				{ id: "concept_version_2", conceptId: "concept_2", label: "Rate", supersedesId: null, createdAt: "t" },
				{ id: "concept_version_3", conceptId: "concept_1", label: "Derivative at a point", supersedesId: "concept_version_1", createdAt: "t2" },
			],
			relationships: [{ id: "relationship_1", createdAt: "t" }],
			relationshipVersions: [{
				id: "relationship_version_1", relationshipId: "relationship_1", sourceConceptVersionId: "concept_version_3", targetConceptVersionId: "concept_version_2",
				propositionLabel: "Derivative at a point is a rate.", supersedesId: null, createdAt: "t2",
				sourceLinks: [{ kind: "graph_chain" as const, refId: "arg_1", refSnapshot: { source: "lesson" } }],
			}],
		};
		store.writeLearnerModel(model);
		// The Stage-1 adapter remains replace-whole internally; rewriting a
		// versioned model must still satisfy its self-referential FK history.
		store.writeLearnerModel(model);
		assert.deepEqual(store.readLearnerModel("target_1"), model);
		assert.deepEqual(createStudyContextStore(temp.file).readLearnerModel("target_1"), model);

		// Writing later Stage-1 context must not rebuild targets and lose the
		// learner model that now refers to target_1.
		context.goals.push({ id: "goal_2", title: "Algebra", createdAt: "t2", updatedAt: "t2" });
		context.targets.push({ id: "target_2", goalId: "goal_2", text: "Polynomials", createdAt: "t2", updatedAt: "t2" });
		store.writeStudyContext(context);
		assert.deepEqual(store.readLearnerModel("target_1"), model);
		assert.throws(() => store.writeStudyContext(emptyStudyContext()), /FOREIGN KEY/);
		assert.throws(() => store.writeLearnerModel({ ...model, targetId: "missing_target" }), /FOREIGN KEY/);
	} finally {
		temp.cleanup();
	}
});
