import { nanoid } from "nanoid";
import {
	applyLearnerModelWrite,
	emptyLearnerModel,
	parseLearnerModelWrite,
	projectLearnerModel,
	type LearnerModelView,
} from "../core/learner-model.ts";
import {
	emptyLearnerModelLayout,
	sanitizeLearnerModelLayout,
	type LearnerModelLayoutState,
	type LearnerModelWorkspaceView,
} from "../core/learner-model-layout.ts";
import type { StudyTarget } from "../core/study-context.ts";
import type { LearnerModelLayoutStore, LearnerModelStore, StudyContextStore } from "../core/ports.ts";
import { stores } from "./stores.ts";

export class LearnerModelInputError extends Error {}

export interface LearnerModelServiceDeps {
	studyContextStore: StudyContextStore;
	learnerModelStore: LearnerModelStore;
	learnerModelLayoutStore: LearnerModelLayoutStore;
	nowIso(): string;
	makeId(prefix: "concept" | "concept_version" | "relationship" | "relationship_version"): string;
}

export function createLearnerModelService(deps: LearnerModelServiceDeps) {
	function requireTarget(targetId: string): StudyTarget {
		const target = targetId.trim() ? deps.studyContextStore.readStudyContext()?.targets.find((candidate) => candidate.id === targetId) : undefined;
		if (!target) throw new LearnerModelInputError("Target no longer exists.");
		return target;
	}

	function read(targetId: string): LearnerModelView | null {
		requireTarget(targetId);
		const state = deps.learnerModelStore.readLearnerModel(targetId);
		return state ? projectLearnerModel(state) : null;
	}

	function readWorkspace(targetId: string): LearnerModelWorkspaceView {
		const target = requireTarget(targetId);
		const state = deps.learnerModelStore.readLearnerModel(targetId);
		const model = state ? projectLearnerModel(state) : null;
		const layout = deps.learnerModelLayoutStore.readLearnerModelLayout(targetId) ?? emptyLearnerModelLayout(targetId);
		return { target, model, layout };
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

	function changeLayout(targetId: string, rawLayout: unknown): LearnerModelLayoutState {
		requireTarget(targetId);
		const model = deps.learnerModelStore.readLearnerModel(targetId);
		if (!model) throw new LearnerModelInputError("Learner model does not exist.");
		let layout;
		try {
			layout = sanitizeLearnerModelLayout(rawLayout, targetId, new Set(model.concepts.map((concept) => concept.id)));
		} catch (error) {
			throw new LearnerModelInputError((error as Error).message);
		}
		deps.learnerModelLayoutStore.writeLearnerModelLayout(layout);
		return layout;
	}

	return { read, readWorkspace, change, changeLayout };
}

export const learnerModelService = createLearnerModelService({
	studyContextStore: stores.studyContextStore,
	learnerModelStore: stores.studyContextStore,
	learnerModelLayoutStore: stores.studyContextStore,
	nowIso: () => new Date().toISOString(),
	makeId: (prefix) => `${prefix}_${nanoid()}`,
});

export function createLearnerModelHttp(service: ReturnType<typeof createLearnerModelService>) {
	function failure(error: unknown): Response {
		if (error instanceof LearnerModelInputError) {
			const status = error.message === "Target no longer exists." ? 404 : 400;
			return Response.json({ error: error.message }, { status });
		}
		console.error("[learner-model] request failed:", error);
		return Response.json({ error: "Could not update the learner model." }, { status: 500 });
	}

	return {
		read(targetId: string): Response {
			try {
				return Response.json(service.readWorkspace(targetId));
			} catch (error) {
				return failure(error);
			}
		},
		change(targetId: string, body: unknown): Response {
			try {
				return Response.json({ model: service.change(targetId, body) });
			} catch (error) {
				return failure(error);
			}
		},
		changeLayout(targetId: string, body: unknown): Response {
			try {
				return Response.json({ layout: service.changeLayout(targetId, body) });
			} catch (error) {
				return failure(error);
			}
		},
	};
}

export const learnerModelHttp = createLearnerModelHttp(learnerModelService);
