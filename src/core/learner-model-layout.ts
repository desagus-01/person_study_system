import type { LearnerModelView } from "./learner-model.ts";
import type { StudyTarget } from "./study-context.ts";

/**
 * Presentation-only layout for a target's learner model.
 *
 * Positions are keyed by stable concept lineage IDs, so semantic revisions do
 * not move nodes or make layout part of the immutable learner-model history.
 */

export interface LearnerConceptPosition {
	conceptId: string;
	x: number;
	y: number;
}

export interface LearnerModelLayoutState {
	version: 1;
	targetId: string;
	positions: LearnerConceptPosition[];
}

/** Serializable read DTO consumed by the focused browser workspace. */
export interface LearnerModelWorkspaceView {
	target: StudyTarget;
	model: LearnerModelView | null;
	layout: LearnerModelLayoutState;
}

function fail(message: string): never {
	throw new Error(message);
}

function finiteNumber(value: unknown, message: string): number {
	if (typeof value !== "number" || !Number.isFinite(value)) fail(message);
	return value;
}

export function emptyLearnerModelLayout(targetId: string): LearnerModelLayoutState {
	if (typeof targetId !== "string" || !targetId.trim()) fail("targetId is required.");
	return { version: 1, targetId: targetId.trim(), positions: [] };
}

export function parseLearnerModelLayout(raw: unknown): LearnerModelLayoutState {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("Invalid learner-model layout record.");
	const value = raw as Partial<LearnerModelLayoutState>;
	if (value.version !== 1 || typeof value.targetId !== "string" || !value.targetId.trim() || !Array.isArray(value.positions)) {
		fail("Invalid learner-model layout record.");
	}
	const conceptIds = new Set<string>();
	const positions = value.positions.map((position): LearnerConceptPosition => {
		if (!position || typeof position !== "object" || Array.isArray(position) || typeof position.conceptId !== "string" || !position.conceptId.trim()) {
			fail("Invalid learner concept position.");
		}
		if (conceptIds.has(position.conceptId)) fail("Learner concept position already exists.");
		conceptIds.add(position.conceptId);
		return {
			conceptId: position.conceptId,
			x: finiteNumber(position.x, "Learner concept position x must be finite."),
			y: finiteNumber(position.y, "Learner concept position y must be finite."),
		};
	});
	return { version: 1, targetId: value.targetId.trim(), positions };
}

/** Admit positions only for concepts belonging to the target semantic model. */
export function sanitizeLearnerModelLayout(raw: unknown, targetId: string, conceptIds: ReadonlySet<string>): LearnerModelLayoutState {
	const parsed = parseLearnerModelLayout(raw);
	if (parsed.targetId !== targetId) fail("Learner-model layout target does not match.");
	if (parsed.positions.some((position) => !conceptIds.has(position.conceptId))) fail("Layout contains a concept outside this learner model.");
	return parsed;
}
