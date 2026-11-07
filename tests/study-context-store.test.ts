import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { backupStudyContextDatabase, createStudyContextStore, restoreStudyContextDatabase } from "../src/store/study-context.ts";
import { emptyStudyContext } from "../src/core/study-context.ts";

function tempDbPath(): { file: string; cleanup: () => void } {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lh-study-context-store-"));
	return {
		file: path.join(dir, "learning.sqlite"),
		cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
	};
}

test("study context store initializes and reads empty state", () => {
	const temp = tempDbPath();
	try {
		const store = createStudyContextStore(temp.file);
		assert.deepEqual(store.readStudyContext(), emptyStudyContext());
	} finally {
		temp.cleanup();
	}
});

test("study context store write/read round-trip", () => {
	const temp = tempDbPath();
	try {
		const store = createStudyContextStore(temp.file);
		const state = {
			version: 1 as const,
			goals: [{ id: "goal_1", title: "Calculus", createdAt: "2026-11-04T00:00:00.000Z", updatedAt: "2026-11-04T00:00:00.000Z" }],
			targets: [{ id: "target_1", goalId: "goal_1", text: "Understand derivatives", createdAt: "2026-11-04T00:00:00.000Z", updatedAt: "2026-11-04T00:00:00.000Z" }],
			links: [{ id: "link_1", targetId: "target_1", kind: "graph_node" as const, refId: "n_abc", createdAt: "2026-11-04T00:00:00.000Z", refSnapshot: { from: "lesson", page: 2 } }],
		};
		store.writeStudyContext(state);
		assert.deepEqual(store.readStudyContext(), state);
	} finally {
		temp.cleanup();
	}
});

test("study context store enforces unique target/kind/ref links", () => {
	const temp = tempDbPath();
	try {
		const store = createStudyContextStore(temp.file);
		assert.throws(() => {
			store.writeStudyContext({
				version: 1,
				goals: [{ id: "goal_1", title: "Probability", createdAt: "t", updatedAt: "t" }],
				targets: [{ id: "target_1", goalId: "goal_1", text: "Bayes", createdAt: "t", updatedAt: "t" }],
				links: [
					{ id: "link_1", targetId: "target_1", kind: "graph_chain", refId: "arg_1", createdAt: "t" },
					{ id: "link_2", targetId: "target_1", kind: "graph_chain", refId: "arg_1", createdAt: "t" },
				],
			});
		});
	} finally {
		temp.cleanup();
	}
});

test("study context backup/restore round-trips a durable snapshot", () => {
	const temp = tempDbPath();
	try {
		const store = createStudyContextStore(temp.file);
		const baseline = {
			version: 1 as const,
			goals: [{ id: "goal_1", title: "Linear algebra", createdAt: "t1", updatedAt: "t1" }],
			targets: [{ id: "target_1", goalId: "goal_1", text: "Eigenvalues", createdAt: "t1", updatedAt: "t1" }],
			links: [{ id: "link_1", targetId: "target_1", kind: "graph_chain" as const, refId: "arg_7", createdAt: "t1", refSnapshot: { excerpt: "A v = λ v" } }],
		};
		store.writeStudyContext(baseline);

		const backupFile = path.join(path.dirname(temp.file), "learning-backup.sqlite");
		backupStudyContextDatabase(temp.file, backupFile);
		assert.ok(fs.existsSync(backupFile));

		store.writeStudyContext(emptyStudyContext());
		assert.deepEqual(store.readStudyContext(), emptyStudyContext());

		restoreStudyContextDatabase(temp.file, backupFile);
		assert.deepEqual(store.readStudyContext(), baseline);
	} finally {
		temp.cleanup();
	}
});
