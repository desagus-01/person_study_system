import React, { act } from "react";
(globalThis as Record<string, unknown>).React = React;
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import type { Root } from "react-dom/client";
import { parseHTML } from "linkedom";
import type { LearnerModelWorkspaceView } from "../src/core/learner-model-layout.ts";

const dom = parseHTML("<html><body></body></html>");
Object.assign(dom.document, { oninput: null });
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
Object.assign(globalThis, {
	window: dom.window,
	document: dom.document,
	Element: dom.window.Element,
	HTMLElement: dom.window.HTMLElement,
	HTMLInputElement: dom.window.HTMLInputElement,
	HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
	SVGElement: dom.window.SVGElement,
	Event: dom.window.Event,
	CustomEvent: dom.window.CustomEvent,
	ResizeObserver: ResizeObserverStub,
	requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 0),
	cancelAnimationFrame: (id: number) => clearTimeout(id),
	IS_REACT_ACT_ENVIRONMENT: true,
});

const originalFetch = globalThis.fetch;
let root: Root | undefined;
let host: HTMLDivElement | undefined;

afterEach(async () => {
	await act(async () => root?.unmount());
	host?.remove();
	root = undefined;
	host = undefined;
	globalThis.fetch = originalFetch;
});

function workspace(): LearnerModelWorkspaceView {
	return {
		target: { id: "target_1", goalId: "goal_1", text: "Understand limits", createdAt: "t", updatedAt: "t" },
		model: null,
		layout: { version: 1, targetId: "target_1", positions: [] },
	};
}

test("workspace add-concept interaction sends a semantic write and renders the returned node", async () => {
	const writes: unknown[] = [];
	globalThis.fetch = async (_input, init) => {
		if (!init?.method) return Response.json(workspace());
		assert.equal(init.method, "PATCH");
		writes.push(JSON.parse(String(init.body)));
		return Response.json({ model: {
			version: 1, targetId: "target_1", createdAt: "t",
			concepts: [{ id: "concept_1", createdAt: "t" }],
			conceptVersions: [{ id: "concept_version_1", conceptId: "concept_1", label: "Limit", supersedesId: null, createdAt: "t" }],
			relationships: [], relationshipVersions: [],
			currentConceptVersions: [{ id: "concept_version_1", conceptId: "concept_1", label: "Limit", supersedesId: null, createdAt: "t" }],
			currentRelationshipVersions: [],
		} });
	};
	const { createRoot } = await import("react-dom/client");
	const { LearnerModelWorkspace } = await import("../components/learner-model-workspace.tsx");
	host = document.createElement("div");
	document.body.append(host);
	root = createRoot(host);
	await act(async () => root!.render(<LearnerModelWorkspace targetId="target_1" />));
	await act(async () => { await Promise.resolve(); });
	const input = document.querySelector('[data-testid="new-concept-input"]') as HTMLInputElement;
	assert.ok(input);
	await act(async () => {
		Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(input, "Limit");
		input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
		input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
	});
	assert.equal(input.value, "Limit");
	await act(async () => document.querySelector('[data-testid="new-concept-input"]')!.closest("form")!.dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true })));
	assert.deepEqual(writes, [{ action: "create_concept", label: "Limit" }]);
	assert.match(document.body.textContent ?? "", /Limit/);
});
