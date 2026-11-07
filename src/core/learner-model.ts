/**
 * Stage 2 learner-model contract.
 *
 * A target owns at most one learner model. Concept and relationship lineages
 * are stable identities; their content lives in immutable versions. The
 * current projection selects the leaf version in each lineage.
 */

import type { JsonValue, StudyReferenceKind, StudyReferenceResolver, StudyReferenceStatus } from "./study-context.ts";

export interface LearnerConcept {
	id: string;
	createdAt: string;
}

export interface LearnerConceptVersion {
	id: string;
	conceptId: string;
	label: string;
	supersedesId: string | null;
	createdAt: string;
}

export interface LearnerRelationship {
	id: string;
	createdAt: string;
}

export interface LearnerRelationshipSourceLink {
	kind: StudyReferenceKind;
	refId: string;
	refSnapshot?: JsonValue;
}

export interface LearnerRelationshipSourceLinkView extends LearnerRelationshipSourceLink {
	status: StudyReferenceStatus;
}

export interface LearnerRelationshipVersion {
	id: string;
	relationshipId: string;
	sourceConceptVersionId: string;
	targetConceptVersionId: string;
	propositionLabel: string;
	supersedesId: string | null;
	createdAt: string;
	sourceLinks: LearnerRelationshipSourceLink[];
}

export interface LearnerModelState {
	version: 1;
	targetId: string;
	createdAt: string;
	concepts: LearnerConcept[];
	conceptVersions: LearnerConceptVersion[];
	relationships: LearnerRelationship[];
	relationshipVersions: LearnerRelationshipVersion[];
}

export interface LearnerModelView extends LearnerModelState {
	currentConceptVersions: LearnerConceptVersion[];
	currentRelationshipVersions: LearnerRelationshipVersion[];
}

export interface LearnerModelReferenceView extends Omit<LearnerModelView, "currentRelationshipVersions"> {
	currentRelationshipVersions: Array<Omit<LearnerRelationshipVersion, "sourceLinks"> & { sourceLinks: LearnerRelationshipSourceLinkView[] }>;
}

export type LearnerModelWrite =
	| { action: "create_concept"; label: string }
	| { action: "revise_concept"; conceptId: string; label: string }
	| { action: "create_relationship"; sourceConceptVersionId: string; targetConceptVersionId: string; propositionLabel: string; sourceLinks?: LearnerRelationshipSourceLink[] }
	| { action: "revise_relationship"; relationshipId: string; sourceConceptVersionId: string; targetConceptVersionId: string; propositionLabel: string; sourceLinks?: LearnerRelationshipSourceLink[] };

export interface LearnerModelWriteDeps {
	nowIso(): string;
	makeId(prefix: "concept" | "concept_version" | "relationship" | "relationship_version"): string;
}

const defaultDeps: LearnerModelWriteDeps = {
	nowIso: () => new Date().toISOString(),
	makeId: (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
};

function fail(message: string): never {
	throw new Error(message);
}

function text(value: unknown, message: string): string {
	if (typeof value !== "string" || !value.trim()) fail(message);
	return value.trim();
}

function isJsonValue(value: unknown): value is JsonValue {
	if (value === null || typeof value === "string" || typeof value === "boolean") return true;
	if (typeof value === "number") return Number.isFinite(value);
	if (Array.isArray(value)) return value.every(isJsonValue);
	if (!value || typeof value !== "object") return false;
	return Object.values(value as Record<string, unknown>).every(isJsonValue);
}

function referenceKind(value: unknown): StudyReferenceKind | null {
	return value === "graph_node" || value === "graph_chain" || value === "notes_source" ? value : null;
}

function parseSourceLinks(value: unknown): LearnerRelationshipSourceLink[] {
	if (value === undefined) return [];
	if (!Array.isArray(value)) fail("Relationship source links must be an array.");
	const links = value.map((item): LearnerRelationshipSourceLink => {
		if (!item || typeof item !== "object" || Array.isArray(item)) fail("Invalid relationship source link.");
		const raw = item as Record<string, unknown>;
		const kind = referenceKind(raw.kind);
		if (!kind) fail("Relationship source link kind is invalid.");
		const refId = text(raw.refId, "Relationship source link refId is required.");
		if (raw.refSnapshot !== undefined && !isJsonValue(raw.refSnapshot)) fail("Relationship source link snapshot must be valid JSON.");
		return { kind, refId, ...(raw.refSnapshot === undefined ? {} : { refSnapshot: raw.refSnapshot }) };
	});
	const keys = new Set<string>();
	for (const link of links) {
		const key = `${link.kind}\u0000${link.refId}`;
		if (keys.has(key)) fail("Relationship source link already exists.");
		keys.add(key);
	}
	return links;
}

export function emptyLearnerModel(targetId: string, createdAt: string): LearnerModelState {
	return { version: 1, targetId: text(targetId, "targetId is required."), createdAt, concepts: [], conceptVersions: [], relationships: [], relationshipVersions: [] };
}

export function parseLearnerModel(raw: unknown): LearnerModelState {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("Invalid learner model record.");
	const state = raw as Partial<LearnerModelState>;
	if (state.version !== 1 || typeof state.targetId !== "string" || !state.targetId.trim() || typeof state.createdAt !== "string"
		|| !Array.isArray(state.concepts) || !Array.isArray(state.conceptVersions) || !Array.isArray(state.relationships) || !Array.isArray(state.relationshipVersions)) fail("Invalid learner model record.");
	const conceptIds = new Set<string>();
	for (const concept of state.concepts) {
		if (!concept || typeof concept !== "object" || typeof concept.id !== "string" || !concept.id || conceptIds.has(concept.id) || typeof concept.createdAt !== "string") fail("Invalid learner concept.");
		conceptIds.add(concept.id);
	}
	const conceptVersions = new Map<string, LearnerConceptVersion>();
	for (const version of state.conceptVersions) {
		if (!version || typeof version !== "object" || typeof version.id !== "string" || !version.id || conceptVersions.has(version.id)
			|| !conceptIds.has(version.conceptId) || typeof version.label !== "string" || !version.label.trim()
			|| (version.supersedesId !== null && typeof version.supersedesId !== "string") || typeof version.createdAt !== "string") fail("Invalid learner concept version.");
		conceptVersions.set(version.id, version);
	}
	validateVersionLineages([...conceptIds], [...conceptVersions.values()], (version) => version.conceptId, "concept");
	const relationshipIds = new Set<string>();
	for (const relationship of state.relationships) {
		if (!relationship || typeof relationship !== "object" || typeof relationship.id !== "string" || !relationship.id || relationshipIds.has(relationship.id) || typeof relationship.createdAt !== "string") fail("Invalid learner relationship.");
		relationshipIds.add(relationship.id);
	}
	const relationshipVersions = new Map<string, LearnerRelationshipVersion>();
	for (const version of state.relationshipVersions) {
		if (!version || typeof version !== "object" || typeof version.id !== "string" || !version.id || relationshipVersions.has(version.id)
			|| !relationshipIds.has(version.relationshipId) || !conceptVersions.has(version.sourceConceptVersionId) || !conceptVersions.has(version.targetConceptVersionId)
			|| typeof version.propositionLabel !== "string" || !version.propositionLabel.trim()
			|| (version.supersedesId !== null && typeof version.supersedesId !== "string") || typeof version.createdAt !== "string") fail("Invalid learner relationship version.");
		parseSourceLinks(version.sourceLinks);
		relationshipVersions.set(version.id, version);
	}
	validateVersionLineages([...relationshipIds], [...relationshipVersions.values()], (version) => version.relationshipId, "relationship");
	return structuredClone(state as LearnerModelState);
}

function validateVersionLineages<T extends { id: string; supersedesId: string | null }>(lineageIds: string[], versions: T[], lineageOf: (version: T) => string, label: string): void {
	const grouped = new Map<string, T[]>();
	for (const version of versions) {
		const lineageId = lineageOf(version);
		const list = grouped.get(lineageId) ?? [];
		list.push(version);
		grouped.set(lineageId, list);
	}
	for (const lineageId of lineageIds) {
		const entries = grouped.get(lineageId);
		if (!entries?.length) fail(`Learner ${label} has no versions.`);
		const ids = new Set(entries.map((entry) => entry.id));
		const superseded = new Set<string>();
		for (const entry of entries) {
			if (entry.supersedesId !== null) {
				if (!ids.has(entry.supersedesId) || entry.supersedesId === entry.id || superseded.has(entry.supersedesId)) fail(`Invalid learner ${label} version lineage.`);
				superseded.add(entry.supersedesId);
			}
		}
		if (entries.filter((entry) => entry.supersedesId === null).length !== 1 || entries.filter((entry) => !superseded.has(entry.id)).length !== 1) fail(`Invalid learner ${label} version lineage.`);
	}
}

export function parseLearnerModelWrite(raw: unknown): LearnerModelWrite {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("Invalid learner-model write action.");
	const value = raw as Record<string, unknown>;
	switch (value.action) {
		case "create_concept": return { action: value.action, label: text(value.label, "Concept label is required.") };
		case "revise_concept": return { action: value.action, conceptId: text(value.conceptId, "conceptId is required."), label: text(value.label, "Concept label is required.") };
		case "create_relationship": return {
			action: value.action,
			sourceConceptVersionId: text(value.sourceConceptVersionId, "sourceConceptVersionId is required."),
			targetConceptVersionId: text(value.targetConceptVersionId, "targetConceptVersionId is required."),
			propositionLabel: text(value.propositionLabel, "Relationship propositionLabel is required."),
			sourceLinks: parseSourceLinks(value.sourceLinks),
		};
		case "revise_relationship": return {
			action: value.action,
			relationshipId: text(value.relationshipId, "relationshipId is required."),
			sourceConceptVersionId: text(value.sourceConceptVersionId, "sourceConceptVersionId is required."),
			targetConceptVersionId: text(value.targetConceptVersionId, "targetConceptVersionId is required."),
			propositionLabel: text(value.propositionLabel, "Relationship propositionLabel is required."),
			sourceLinks: parseSourceLinks(value.sourceLinks),
		};
		default: fail("Unsupported learner-model write action.");
	}
}

function currentVersion<T extends { id: string; supersedesId: string | null }>(versions: T[]): T {
	const superseded = new Set(versions.flatMap((version) => version.supersedesId === null ? [] : [version.supersedesId]));
	const current = versions.filter((version) => !superseded.has(version.id));
	if (current.length !== 1) fail("Learner model version lineage is invalid.");
	return current[0]!;
}

export function projectLearnerModel(state: LearnerModelState): LearnerModelView {
	const valid = parseLearnerModel(state);
	return {
		...valid,
		currentConceptVersions: valid.concepts.map((concept) => currentVersion(valid.conceptVersions.filter((version) => version.conceptId === concept.id))),
		currentRelationshipVersions: valid.relationships.map((relationship) => currentVersion(valid.relationshipVersions.filter((version) => version.relationshipId === relationship.id))),
	};
}

function referenceStatus(link: LearnerRelationshipSourceLink, resolver: StudyReferenceResolver): StudyReferenceStatus {
	if (link.kind === "graph_node") return resolver.graphNodeIds.has(link.refId) ? "resolved" : "unresolved";
	if (link.kind === "graph_chain") return resolver.graphChainIds.has(link.refId) ? "resolved" : "unresolved";
	return resolver.notesSourceIds.has(link.refId) ? "resolved" : "unresolved";
}

/** Preserve missing external provenance while making its availability explicit. */
export function projectLearnerModelReferences(state: LearnerModelState, resolver: StudyReferenceResolver): LearnerModelReferenceView {
	const view = projectLearnerModel(state);
	return {
		...view,
		currentRelationshipVersions: view.currentRelationshipVersions.map((version) => ({
			...version,
			sourceLinks: version.sourceLinks.map((link) => ({ ...structuredClone(link), status: referenceStatus(link, resolver) })),
		})),
	};
}

export function applyLearnerModelWrite(state: LearnerModelState, action: LearnerModelWrite, deps: Partial<LearnerModelWriteDeps> = {}): LearnerModelState {
	const next = parseLearnerModel(state);
	const d = { ...defaultDeps, ...deps };
	const now = d.nowIso();
	if (action.action === "create_concept") {
		const conceptId = d.makeId("concept");
		next.concepts.push({ id: conceptId, createdAt: now });
		next.conceptVersions.push({ id: d.makeId("concept_version"), conceptId, label: action.label, supersedesId: null, createdAt: now });
		return next;
	}
	if (action.action === "revise_concept") {
		if (!next.concepts.some((concept) => concept.id === action.conceptId)) fail("Concept no longer exists.");
		const previous = currentVersion(next.conceptVersions.filter((version) => version.conceptId === action.conceptId));
		next.conceptVersions.push({ id: d.makeId("concept_version"), conceptId: action.conceptId, label: action.label, supersedesId: previous.id, createdAt: now });
		return next;
	}
	const endpointExists = (id: string) => next.conceptVersions.some((version) => version.id === id);
	if (!endpointExists(action.sourceConceptVersionId) || !endpointExists(action.targetConceptVersionId)) fail("Relationship endpoints must be concept versions in this learner model.");
	if (action.action === "create_relationship") {
		const relationshipId = d.makeId("relationship");
		next.relationships.push({ id: relationshipId, createdAt: now });
		next.relationshipVersions.push({ id: d.makeId("relationship_version"), relationshipId, sourceConceptVersionId: action.sourceConceptVersionId, targetConceptVersionId: action.targetConceptVersionId, propositionLabel: action.propositionLabel, supersedesId: null, createdAt: now, sourceLinks: action.sourceLinks ?? [] });
		return next;
	}
	if (!next.relationships.some((relationship) => relationship.id === action.relationshipId)) fail("Relationship no longer exists.");
	const previous = currentVersion(next.relationshipVersions.filter((version) => version.relationshipId === action.relationshipId));
	next.relationshipVersions.push({ id: d.makeId("relationship_version"), relationshipId: action.relationshipId, sourceConceptVersionId: action.sourceConceptVersionId, targetConceptVersionId: action.targetConceptVersionId, propositionLabel: action.propositionLabel, supersedesId: previous.id, createdAt: now, sourceLinks: action.sourceLinks ?? [] });
	return next;
}
