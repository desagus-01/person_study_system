import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { LEARNING_DB_FILE } from "../../config.ts";
import type { LearnerModelStore, StudyContextStore } from "../core/ports.ts";
import {
	emptyStudyContext,
	parseStudyContext,
	type JsonValue,
	type StudyContextState,
	type StudyReferenceKind,
} from "../core/study-context.ts";
import { parseLearnerModel, type LearnerModelState } from "../core/learner-model.ts";

const SCHEMA_VERSION = 3;
const REFERENCE_KINDS: StudyReferenceKind[] = ["graph_node", "graph_chain", "notes_source"];

function openDatabase(databasePath: string): Database.Database {
	fs.mkdirSync(path.dirname(databasePath), { recursive: true });
	const db = new Database(databasePath);
	db.pragma("foreign_keys = ON");
	db.pragma("journal_mode = WAL");
	migrate(db);
	return db;
}

function migrate(db: Database.Database): void {
	const version = Number(db.pragma("user_version", { simple: true }) ?? 0);
	if (version > SCHEMA_VERSION) throw new Error(`Study context DB version ${version} is newer than supported ${SCHEMA_VERSION}`);
	if (version < 1) {
		db.exec(`
			CREATE TABLE IF NOT EXISTS goals (
				id TEXT PRIMARY KEY,
				title TEXT NOT NULL,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS targets (
				id TEXT PRIMARY KEY,
				goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE RESTRICT,
				text TEXT NOT NULL,
				created_at TEXT NOT NULL,
				updated_at TEXT NOT NULL
			);

			CREATE TABLE IF NOT EXISTS reference_links (
				id TEXT PRIMARY KEY,
				target_id TEXT NOT NULL REFERENCES targets(id) ON DELETE RESTRICT,
				kind TEXT NOT NULL CHECK (kind IN ('graph_node', 'graph_chain', 'notes_source')),
				ref_id TEXT NOT NULL,
				created_at TEXT NOT NULL,
				UNIQUE(target_id, kind, ref_id)
			);
		`);
		db.pragma("user_version = 1");
	}
	if (version < 2) {
		db.exec("ALTER TABLE reference_links ADD COLUMN ref_snapshot TEXT");
		db.pragma("user_version = 2");
	}
	if (version < 3) {
		db.exec(`
			CREATE TABLE learner_models (
				target_id TEXT PRIMARY KEY REFERENCES targets(id) ON DELETE RESTRICT,
				created_at TEXT NOT NULL
			);

			CREATE TABLE learner_concepts (
				id TEXT PRIMARY KEY,
				model_target_id TEXT NOT NULL REFERENCES learner_models(target_id) ON DELETE CASCADE,
				created_at TEXT NOT NULL
			);

			CREATE TABLE learner_concept_versions (
				id TEXT PRIMARY KEY,
				concept_id TEXT NOT NULL REFERENCES learner_concepts(id) ON DELETE CASCADE,
				label TEXT NOT NULL,
				supersedes_id TEXT REFERENCES learner_concept_versions(id) ON DELETE RESTRICT,
				created_at TEXT NOT NULL
			);

			CREATE TABLE learner_relationships (
				id TEXT PRIMARY KEY,
				model_target_id TEXT NOT NULL REFERENCES learner_models(target_id) ON DELETE CASCADE,
				created_at TEXT NOT NULL
			);

			CREATE TABLE learner_relationship_versions (
				id TEXT PRIMARY KEY,
				relationship_id TEXT NOT NULL REFERENCES learner_relationships(id) ON DELETE CASCADE,
				source_concept_version_id TEXT NOT NULL REFERENCES learner_concept_versions(id) ON DELETE RESTRICT,
				target_concept_version_id TEXT NOT NULL REFERENCES learner_concept_versions(id) ON DELETE RESTRICT,
				proposition_label TEXT NOT NULL,
				supersedes_id TEXT REFERENCES learner_relationship_versions(id) ON DELETE RESTRICT,
				created_at TEXT NOT NULL
			);

			CREATE TABLE learner_relationship_source_links (
				relationship_version_id TEXT NOT NULL REFERENCES learner_relationship_versions(id) ON DELETE CASCADE,
				kind TEXT NOT NULL CHECK (kind IN ('graph_node', 'graph_chain', 'notes_source')),
				ref_id TEXT NOT NULL,
				ref_snapshot TEXT,
				PRIMARY KEY (relationship_version_id, kind, ref_id)
			);
		`);
		db.pragma("user_version = 3");
	}
}

function withDatabase<T>(databasePath: string, fn: (db: Database.Database) => T): T {
	const db = openDatabase(databasePath);
	try {
		return fn(db);
	} finally {
		db.close();
	}
}

function parseSnapshot(raw: unknown): JsonValue | undefined {
	if (raw === null || raw === undefined) return undefined;
	if (typeof raw !== "string") throw new Error("Invalid snapshot payload stored in study context database.");
	return JSON.parse(raw) as JsonValue;
}

function mapState(db: Database.Database): StudyContextState {
	const goals = db.prepare("SELECT id, title, created_at AS createdAt, updated_at AS updatedAt FROM goals ORDER BY created_at, id").all() as StudyContextState["goals"];
	const targets = db.prepare("SELECT id, goal_id AS goalId, text, created_at AS createdAt, updated_at AS updatedAt FROM targets ORDER BY created_at, id").all() as StudyContextState["targets"];
	const rows = db.prepare("SELECT id, target_id AS targetId, kind, ref_id AS refId, created_at AS createdAt, ref_snapshot AS refSnapshot FROM reference_links ORDER BY created_at, id").all() as Array<{
		id: string;
		targetId: string;
		kind: StudyReferenceKind;
		refId: string;
		createdAt: string;
		refSnapshot: string | null;
	}>;
	const links = rows.map((row) => ({
		id: row.id,
		targetId: row.targetId,
		kind: row.kind,
		refId: row.refId,
		createdAt: row.createdAt,
		...(row.refSnapshot === null ? {} : { refSnapshot: parseSnapshot(row.refSnapshot) }),
	}));
	return parseStudyContext({ version: 1, goals, targets, links });
}

function writeState(db: Database.Database, input: StudyContextState): void {
	const state = parseStudyContext(input);
	const write = db.transaction((next: StudyContextState) => {
		// Stage 1 exposes a replace-whole state port, but target rows are now
		// referenced by learner models. Upsert retained rows rather than
		// rebuilding the entire context, so adding a goal/target never deletes
		// Stage-2 history. A caller that actually removes a referenced target
		// still receives the restrictive foreign-key error.
		db.prepare("DELETE FROM reference_links").run();
		const deleteTargets = db.prepare("DELETE FROM targets WHERE id = ?");
		const targetIds = new Set(next.targets.map((target) => target.id));
		for (const row of db.prepare("SELECT id FROM targets").all() as Array<{ id: string }>) {
			if (!targetIds.has(row.id)) deleteTargets.run(row.id);
		}
		const deleteGoals = db.prepare("DELETE FROM goals WHERE id = ?");
		const goalIds = new Set(next.goals.map((goal) => goal.id));
		for (const row of db.prepare("SELECT id FROM goals").all() as Array<{ id: string }>) {
			if (!goalIds.has(row.id)) deleteGoals.run(row.id);
		}

		const upsertGoal = db.prepare(`INSERT INTO goals (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET title = excluded.title, created_at = excluded.created_at, updated_at = excluded.updated_at`);
		for (const goal of next.goals) upsertGoal.run(goal.id, goal.title, goal.createdAt, goal.updatedAt);

		const upsertTarget = db.prepare(`INSERT INTO targets (id, goal_id, text, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET goal_id = excluded.goal_id, text = excluded.text, created_at = excluded.created_at, updated_at = excluded.updated_at`);
		for (const target of next.targets) upsertTarget.run(target.id, target.goalId, target.text, target.createdAt, target.updatedAt);

		const insertLink = db.prepare("INSERT INTO reference_links (id, target_id, kind, ref_id, created_at, ref_snapshot) VALUES (?, ?, ?, ?, ?, ?)");
		for (const link of next.links) {
			if (!REFERENCE_KINDS.includes(link.kind)) throw new Error("Reference link kind is invalid.");
			insertLink.run(
				link.id,
				link.targetId,
				link.kind,
				link.refId,
				link.createdAt,
				link.refSnapshot === undefined ? null : JSON.stringify(link.refSnapshot),
			);
		}
	});
	write(state);
}

function escapeSqlLiteral(value: string): string {
	return value.replaceAll("'", "''");
}

/** WAL-safe backup snapshot using SQLite's VACUUM INTO. */
export function backupStudyContextDatabase(databasePath: string, backupPath: string): void {
	withDatabase(databasePath, (db) => {
		fs.mkdirSync(path.dirname(backupPath), { recursive: true });
		fs.rmSync(backupPath, { force: true });
		db.exec(`VACUUM INTO '${escapeSqlLiteral(path.resolve(backupPath))}'`);
	});
}

/** Replace the active DB file with a backup and validate it can be opened. */
export function restoreStudyContextDatabase(databasePath: string, backupPath: string): void {
	if (!fs.existsSync(backupPath)) throw new Error(`Backup file does not exist: ${backupPath}`);
	const target = path.resolve(databasePath);
	const temp = `${target}.restore.tmp`;
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.copyFileSync(backupPath, temp);
	fs.renameSync(temp, target);
	fs.rmSync(`${target}-wal`, { force: true });
	fs.rmSync(`${target}-shm`, { force: true });
	withDatabase(target, (db) => {
		const check = db.pragma("integrity_check", { simple: true });
		if (String(check).toLowerCase() !== "ok") throw new Error("Restored study context database failed integrity_check.");
	});
}

function mapLearnerModel(db: Database.Database, targetId: string): LearnerModelState | null {
	const model = db.prepare("SELECT target_id AS targetId, created_at AS createdAt FROM learner_models WHERE target_id = ?").get(targetId) as { targetId: string; createdAt: string } | undefined;
	if (!model) return null;
	const concepts = db.prepare("SELECT id, created_at AS createdAt FROM learner_concepts WHERE model_target_id = ? ORDER BY created_at, id").all(targetId);
	const conceptVersions = db.prepare(`SELECT learner_concept_versions.id, concept_id AS conceptId, label, supersedes_id AS supersedesId, learner_concept_versions.created_at AS createdAt
		FROM learner_concept_versions JOIN learner_concepts ON learner_concepts.id = learner_concept_versions.concept_id
		WHERE learner_concepts.model_target_id = ? ORDER BY learner_concept_versions.created_at, learner_concept_versions.id`).all(targetId);
	const relationships = db.prepare("SELECT id, created_at AS createdAt FROM learner_relationships WHERE model_target_id = ? ORDER BY created_at, id").all(targetId);
	const rows = db.prepare(`SELECT learner_relationship_versions.id, relationship_id AS relationshipId, source_concept_version_id AS sourceConceptVersionId,
		target_concept_version_id AS targetConceptVersionId, proposition_label AS propositionLabel, supersedes_id AS supersedesId,
		learner_relationship_versions.created_at AS createdAt, learner_relationship_source_links.kind, learner_relationship_source_links.ref_id AS refId,
		learner_relationship_source_links.ref_snapshot AS refSnapshot
		FROM learner_relationship_versions JOIN learner_relationships ON learner_relationships.id = learner_relationship_versions.relationship_id
		LEFT JOIN learner_relationship_source_links ON learner_relationship_source_links.relationship_version_id = learner_relationship_versions.id
		WHERE learner_relationships.model_target_id = ? ORDER BY learner_relationship_versions.created_at, learner_relationship_versions.id, learner_relationship_source_links.kind, learner_relationship_source_links.ref_id`).all(targetId) as Array<{
		id: string; relationshipId: string; sourceConceptVersionId: string; targetConceptVersionId: string; propositionLabel: string; supersedesId: string | null; createdAt: string; kind: StudyReferenceKind | null; refId: string | null; refSnapshot: string | null;
	}>;
	const versions = new Map<string, LearnerModelState["relationshipVersions"][number]>();
	for (const row of rows) {
		let version = versions.get(row.id);
		if (!version) {
			version = { id: row.id, relationshipId: row.relationshipId, sourceConceptVersionId: row.sourceConceptVersionId, targetConceptVersionId: row.targetConceptVersionId, propositionLabel: row.propositionLabel, supersedesId: row.supersedesId, createdAt: row.createdAt, sourceLinks: [] };
			versions.set(row.id, version);
		}
		if (row.kind !== null && row.refId !== null) version.sourceLinks.push({ kind: row.kind, refId: row.refId, ...(row.refSnapshot === null ? {} : { refSnapshot: parseSnapshot(row.refSnapshot) }) });
	}
	return parseLearnerModel({ version: 1, targetId: model.targetId, createdAt: model.createdAt, concepts, conceptVersions, relationships, relationshipVersions: [...versions.values()] });
}

function writeLearnerModel(db: Database.Database, input: LearnerModelState): void {
	const state = parseLearnerModel(input);
	const write = db.transaction((next: LearnerModelState) => {
		// Supersession links are intentionally restrictive so history cannot be
		// deleted accidentally. This replace-whole adapter therefore clears only
		// the outgoing self-links inside its transaction before replacing a model.
		db.prepare(`DELETE FROM learner_relationship_source_links WHERE relationship_version_id IN (
			SELECT learner_relationship_versions.id FROM learner_relationship_versions
			JOIN learner_relationships ON learner_relationships.id = learner_relationship_versions.relationship_id
			WHERE learner_relationships.model_target_id = ?
		)`).run(next.targetId);
		db.prepare(`UPDATE learner_relationship_versions SET supersedes_id = NULL WHERE relationship_id IN (
			SELECT id FROM learner_relationships WHERE model_target_id = ?
		)`).run(next.targetId);
		db.prepare("DELETE FROM learner_relationship_versions WHERE relationship_id IN (SELECT id FROM learner_relationships WHERE model_target_id = ?)").run(next.targetId);
		db.prepare("DELETE FROM learner_relationships WHERE model_target_id = ?").run(next.targetId);
		db.prepare(`UPDATE learner_concept_versions SET supersedes_id = NULL WHERE concept_id IN (
			SELECT id FROM learner_concepts WHERE model_target_id = ?
		)`).run(next.targetId);
		db.prepare("DELETE FROM learner_concept_versions WHERE concept_id IN (SELECT id FROM learner_concepts WHERE model_target_id = ?)").run(next.targetId);
		db.prepare("DELETE FROM learner_concepts WHERE model_target_id = ?").run(next.targetId);
		db.prepare("DELETE FROM learner_models WHERE target_id = ?").run(next.targetId);
		db.prepare("INSERT INTO learner_models (target_id, created_at) VALUES (?, ?)").run(next.targetId, next.createdAt);
		const insertConcept = db.prepare("INSERT INTO learner_concepts (id, model_target_id, created_at) VALUES (?, ?, ?)");
		for (const concept of next.concepts) insertConcept.run(concept.id, next.targetId, concept.createdAt);
		const insertConceptVersion = db.prepare("INSERT INTO learner_concept_versions (id, concept_id, label, supersedes_id, created_at) VALUES (?, ?, ?, ?, ?)");
		for (const version of next.conceptVersions) insertConceptVersion.run(version.id, version.conceptId, version.label, version.supersedesId, version.createdAt);
		const insertRelationship = db.prepare("INSERT INTO learner_relationships (id, model_target_id, created_at) VALUES (?, ?, ?)");
		for (const relationship of next.relationships) insertRelationship.run(relationship.id, next.targetId, relationship.createdAt);
		const insertRelationshipVersion = db.prepare("INSERT INTO learner_relationship_versions (id, relationship_id, source_concept_version_id, target_concept_version_id, proposition_label, supersedes_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
		const insertSourceLink = db.prepare("INSERT INTO learner_relationship_source_links (relationship_version_id, kind, ref_id, ref_snapshot) VALUES (?, ?, ?, ?)");
		for (const version of next.relationshipVersions) {
			insertRelationshipVersion.run(version.id, version.relationshipId, version.sourceConceptVersionId, version.targetConceptVersionId, version.propositionLabel, version.supersedesId, version.createdAt);
			for (const link of version.sourceLinks) insertSourceLink.run(version.id, link.kind, link.refId, link.refSnapshot === undefined ? null : JSON.stringify(link.refSnapshot));
		}
	});
	write(state);
}

export function createStudyContextStore(databasePath: string): StudyContextStore & LearnerModelStore {
	return {
		readStudyContext() {
			return withDatabase(databasePath, mapState);
		},
		writeStudyContext(state) {
			withDatabase(databasePath, (db) => writeState(db, state));
		},
		readLearnerModel(targetId) {
			return withDatabase(databasePath, (db) => mapLearnerModel(db, targetId));
		},
		writeLearnerModel(state) {
			withDatabase(databasePath, (db) => writeLearnerModel(db, state));
		},
	};
}

export const studyContextStore: StudyContextStore & LearnerModelStore = createStudyContextStore(LEARNING_DB_FILE);

// Transitional utility for tests/scripts that need a known-empty baseline.
export function resetStudyContextForTests(databasePath: string): void {
	withDatabase(databasePath, (db) => writeState(db, emptyStudyContext()));
}
