/**
 * Stage 1 study-context contract:
 * - goals
 * - goal-scoped text targets
 * - target -> external reference links (kind + refId)
 * - optional per-link snapshot payloads
 *
 * Pure domain logic only (no IO).
 */

export type StudyReferenceKind = "graph_node" | "graph_chain" | "notes_source";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface StudyGoal {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
}

export interface StudyTarget {
	id: string;
	goalId: string;
	text: string;
	createdAt: string;
	updatedAt: string;
}

export interface StudyReferenceLink {
	id: string;
	targetId: string;
	kind: StudyReferenceKind;
	refId: string;
	createdAt: string;
	refSnapshot?: JsonValue;
}

export interface StudyContextState {
	version: 1;
	goals: StudyGoal[];
	targets: StudyTarget[];
	links: StudyReferenceLink[];
}

export type StudyReferenceStatus = "resolved" | "unresolved";

export interface StudyReferenceLinkView extends StudyReferenceLink {
	status: StudyReferenceStatus;
}

export interface StudyContextView {
	version: 1;
	goals: StudyGoal[];
	targets: StudyTarget[];
	links: StudyReferenceLinkView[];
}

export interface StudyReferenceResolver {
	graphNodeIds: ReadonlySet<string>;
	graphChainIds: ReadonlySet<string>;
	notesSourceIds: ReadonlySet<string>;
}

export type StudyContextWrite =
	| { action: "create_goal"; title: string }
	| { action: "create_target"; goalId: string; text: string }
	| { action: "create_reference_link"; targetId: string; kind: StudyReferenceKind; refId: string; refSnapshot?: JsonValue };

export interface StudyContextWriteDeps {
	nowIso(): string;
	makeId(prefix: "goal" | "target" | "link"): string;
}

export const emptyStudyContext = (): StudyContextState => ({
	version: 1,
	goals: [],
	targets: [],
	links: [],
});

const defaultDeps: StudyContextWriteDeps = {
	nowIso: () => new Date().toISOString(),
	makeId: (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
};

function fail(message: string): never {
	throw new Error(message);
}

function nonEmptyString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

function asReferenceKind(value: unknown): StudyReferenceKind | null {
	if (value === "graph_node" || value === "graph_chain" || value === "notes_source") return value;
	return null;
}

function isJsonValue(value: unknown): value is JsonValue {
	if (value === null) return true;
	if (typeof value === "string" || typeof value === "boolean") return true;
	if (typeof value === "number") return Number.isFinite(value);
	if (Array.isArray(value)) return value.every((item) => isJsonValue(item));
	if (!value || typeof value !== "object") return false;
	for (const entry of Object.values(value as Record<string, unknown>)) if (!isJsonValue(entry)) return false;
	return true;
}

export function parseStudyContext(raw: unknown): StudyContextState {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("Invalid study context record.");
	const r = raw as Partial<StudyContextState>;
	if (r.version !== 1 || !Array.isArray(r.goals) || !Array.isArray(r.targets) || !Array.isArray(r.links)) fail("Invalid study context record.");
	const goalIds = new Set<string>();
	for (const goal of r.goals) {
		if (!goal || typeof goal !== "object") fail("Invalid goal record.");
		if (!nonEmptyString(goal.id) || goalIds.has(goal.id)) fail("Invalid goal id.");
		if (!nonEmptyString(goal.title) || typeof goal.createdAt !== "string" || typeof goal.updatedAt !== "string") fail("Invalid goal record.");
		goalIds.add(goal.id);
	}
	const targetIds = new Set<string>();
	for (const target of r.targets) {
		if (!target || typeof target !== "object") fail("Invalid target record.");
		if (!nonEmptyString(target.id) || targetIds.has(target.id)) fail("Invalid target id.");
		if (!goalIds.has(target.goalId) || !nonEmptyString(target.text) || typeof target.createdAt !== "string" || typeof target.updatedAt !== "string") fail("Invalid target record.");
		targetIds.add(target.id);
	}
	const linkIds = new Set<string>();
	for (const link of r.links) {
		if (!link || typeof link !== "object") fail("Invalid link record.");
		if (!nonEmptyString(link.id) || linkIds.has(link.id)) fail("Invalid link id.");
		if (!targetIds.has(link.targetId) || !asReferenceKind(link.kind) || !nonEmptyString(link.refId) || typeof link.createdAt !== "string") fail("Invalid link record.");
		if (link.refSnapshot !== undefined && !isJsonValue(link.refSnapshot)) fail("Invalid link snapshot.");
		linkIds.add(link.id);
	}
	return r as StudyContextState;
}

export function parseStudyContextWrite(raw: unknown): StudyContextWrite {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("Invalid study-context write action.");
	const r = raw as Record<string, unknown>;
	switch (r.action) {
		case "create_goal":
			if (!nonEmptyString(r.title)) fail("Goal title is required.");
			return { action: r.action, title: r.title.trim() };
		case "create_target":
			if (!nonEmptyString(r.goalId)) fail("goalId is required.");
			if (!nonEmptyString(r.text)) fail("Target text is required.");
			return { action: r.action, goalId: r.goalId, text: r.text.trim() };
		case "create_reference_link": {
			const kind = asReferenceKind(r.kind);
			if (!nonEmptyString(r.targetId)) fail("targetId is required.");
			if (!kind) fail("Reference kind is invalid.");
			if (!nonEmptyString(r.refId)) fail("refId is required.");
			if (r.refSnapshot !== undefined && !isJsonValue(r.refSnapshot)) fail("refSnapshot must be valid JSON.");
			return {
				action: r.action,
				targetId: r.targetId,
				kind,
				refId: r.refId.trim(),
				...(r.refSnapshot === undefined ? {} : { refSnapshot: r.refSnapshot }),
			};
		}
		default:
			fail("Unsupported study-context write action.");
	}
}

export function applyStudyContextWrite(state: StudyContextState, action: StudyContextWrite, deps: Partial<StudyContextWriteDeps> = {}): StudyContextState {
	const d: StudyContextWriteDeps = { ...defaultDeps, ...deps };
	const next = structuredClone(state);
	if (action.action === "create_goal") {
		const now = d.nowIso();
		next.goals.push({ id: d.makeId("goal"), title: action.title, createdAt: now, updatedAt: now });
		return next;
	}
	if (action.action === "create_target") {
		if (!next.goals.some((goal) => goal.id === action.goalId)) fail("Goal no longer exists.");
		const now = d.nowIso();
		next.targets.push({ id: d.makeId("target"), goalId: action.goalId, text: action.text, createdAt: now, updatedAt: now });
		return next;
	}
	if (!next.targets.some((target) => target.id === action.targetId)) fail("Target no longer exists.");
	if (next.links.some((link) => link.targetId === action.targetId && link.kind === action.kind && link.refId === action.refId)) fail("Reference link already exists.");
	next.links.push({
		id: d.makeId("link"),
		targetId: action.targetId,
		kind: action.kind,
		refId: action.refId,
		createdAt: d.nowIso(),
		...(action.refSnapshot === undefined ? {} : { refSnapshot: action.refSnapshot }),
	});
	return next;
}

function referenceStatus(link: StudyReferenceLink, resolver: StudyReferenceResolver): StudyReferenceStatus {
	if (link.kind === "graph_node") return resolver.graphNodeIds.has(link.refId) ? "resolved" : "unresolved";
	if (link.kind === "graph_chain") return resolver.graphChainIds.has(link.refId) ? "resolved" : "unresolved";
	return resolver.notesSourceIds.has(link.refId) ? "resolved" : "unresolved";
}

export function projectStudyContext(state: StudyContextState, resolver: StudyReferenceResolver): StudyContextView {
	const valid = parseStudyContext(state);
	return {
		version: valid.version,
		goals: structuredClone(valid.goals),
		targets: structuredClone(valid.targets),
		links: valid.links.map((link) => ({ ...structuredClone(link), status: referenceStatus(link, resolver) })),
	};
}
