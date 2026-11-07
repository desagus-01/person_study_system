import { nanoid } from "nanoid";
import {
	applyLearnerModelWrite,
	emptyLearnerModel,
	parseLearnerModelWrite,
	projectLearnerModel,
	type LearnerModelView,
} from "../core/learner-model.ts";
import type { LearnerModelStore, StudyContextStore } from "../core/ports.ts";
import { stores } from "./stores.ts";

export class LearnerModelInputError extends Error {}

export interface LearnerModelServiceDeps {
	studyContextStore: StudyContextStore;
	learnerModelStore: LearnerModelStore;
	nowIso(): string;
	makeId(prefix: "concept" | "concept_version" | "relationship" | "relationship_version"): string;
}

export function createLearnerModelService(deps: LearnerModelServiceDeps) {
	function requireTarget(targetId: string): void {
		if (!targetId.trim() || !deps.studyContextStore.readStudyContext()?.targets.some((target) => target.id === targetId)) {
			throw new LearnerModelInputError("Target no longer exists.");
		}
	}

	function read(targetId: string): LearnerModelView | null {
		requireTarget(targetId);
		const state = deps.learnerModelStore.readLearnerModel(targetId);
		return state ? projectLearnerModel(state) : null;
	}

	function change(targetId: string, rawAction: unknown): LearnerModelView {
		requireTarget(targetId);
		let action;
		try {
			action = parseLearnerModelWrite(rawAction);
		} catch (error) {
			throw new LearnerModelInputError((error as Error).message);
		}
		const now = deps.nowIso();
		const state = deps.learnerModelStore.readLearnerModel(targetId) ?? emptyLearnerModel(targetId, now);
		let next;
		try {
			next = applyLearnerModelWrite(state, action, { nowIso: () => now, makeId: deps.makeId });
		} catch (error) {
			throw new LearnerModelInputError((error as Error).message);
		}
		deps.learnerModelStore.writeLearnerModel(next);
		return projectLearnerModel(next);
	}

	return { read, change };
}

export const learnerModelService = createLearnerModelService({
	studyContextStore: stores.studyContextStore,
	learnerModelStore: stores.studyContextStore,
	nowIso: () => new Date().toISOString(),
	makeId: (prefix) => `${prefix}_${nanoid()}`,
});
