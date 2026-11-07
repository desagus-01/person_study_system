"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Background,
	Controls,
	Handle,
	MarkerType,
	Position,
	ReactFlow,
	applyNodeChanges,
	type Connection,
	type Edge,
	type Node,
	type NodeChange,
} from "@xyflow/react";
import type {
	LearnerConceptPosition,
	LearnerModelLayoutState,
	LearnerModelView,
	LearnerModelWorkspaceView,
} from "@/src/core";

interface ConceptNodeData extends Record<string, unknown> {
	label: string;
}

type ConceptNode = Node<ConceptNodeData, "concept">;
type RelationshipEdge = Edge<{ propositionLabel: string }>;

function ConceptNodeView({ data }: { data: ConceptNodeData }) {
	return (
		<div className="min-w-36 max-w-56 rounded-xl border border-border bg-card px-4 py-3 text-center text-sm text-foreground shadow-lg">
			<Handle type="target" position={Position.Left} />
			<span className="block whitespace-normal leading-snug">{data.label}</span>
			<Handle type="source" position={Position.Right} />
		</div>
	);
}

const nodeTypes = { concept: ConceptNodeView };

function defaultPosition(index: number): { x: number; y: number } {
	const column = index % 3;
	const row = Math.floor(index / 3);
	return { x: 80 + column * 260, y: 100 + row * 170 };
}

export function learnerModelElements(model: LearnerModelView | null, layout: LearnerModelLayoutState): {
	nodes: ConceptNode[];
	edges: RelationshipEdge[];
} {
	if (!model) return { nodes: [], edges: [] };
	const positions = new Map(layout.positions.map((position) => [position.conceptId, position]));
	const currentConcepts = new Map(model.currentConceptVersions.map((version) => [version.conceptId, version]));
	const versionConceptIds = new Map(model.conceptVersions.map((version) => [version.id, version.conceptId]));
	const nodes = model.concepts.map((concept, index): ConceptNode => {
		const version = currentConcepts.get(concept.id);
		const saved = positions.get(concept.id);
		return {
			id: concept.id,
			type: "concept",
			position: saved ? { x: saved.x, y: saved.y } : defaultPosition(index),
			data: { label: version?.label ?? "Unnamed concept" },
		};
	});
	const edges = model.currentRelationshipVersions.flatMap((relationship): RelationshipEdge[] => {
		const source = versionConceptIds.get(relationship.sourceConceptVersionId);
		const target = versionConceptIds.get(relationship.targetConceptVersionId);
		if (!source || !target) return [];
		return [{
			id: relationship.relationshipId,
			source,
			target,
			label: relationship.propositionLabel,
			data: { propositionLabel: relationship.propositionLabel },
			markerEnd: { type: MarkerType.ArrowClosed },
			style: { strokeWidth: 1.5 },
			labelStyle: { fill: "var(--foreground)", fontSize: 12 },
			labelBgStyle: { fill: "var(--card)", fillOpacity: 0.95 },
			labelBgPadding: [6, 4],
			labelBgBorderRadius: 6,
		}];
	});
	return { nodes, edges };
}

async function responseJson<T>(response: Response): Promise<T> {
	const body = await response.json().catch(() => null) as { error?: string } | null;
	if (!response.ok) throw new Error(body?.error ?? "The learner model could not be saved.");
	return body as T;
}

export function LearnerModelWorkspace({ targetId }: { targetId: string }) {
	const [workspace, setWorkspace] = useState<LearnerModelWorkspaceView | null>(null);
	const [nodes, setNodes] = useState<ConceptNode[]>([]);
	const [edges, setEdges] = useState<RelationshipEdge[]>([]);
	const [newConcept, setNewConcept] = useState("");
	const newConceptRef = useRef<HTMLInputElement>(null);
	const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
	const [conceptLabel, setConceptLabel] = useState("");
	const [relationshipDraft, setRelationshipDraft] = useState<{ relationshipId: string | null; sourceConceptId: string; targetConceptId: string; label: string } | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const layoutWrites = useRef(Promise.resolve());

	const applyWorkspace = useCallback((next: LearnerModelWorkspaceView) => {
		setWorkspace(next);
		const elements = learnerModelElements(next.model, next.layout);
		setNodes(elements.nodes);
		setEdges(elements.edges);
	}, []);

	useEffect(() => {
		let cancelled = false;
		fetch(`/api/study/targets/${encodeURIComponent(targetId)}/learner-model`)
			.then((response) => responseJson<LearnerModelWorkspaceView>(response))
			.then((next) => { if (!cancelled) applyWorkspace(next); })
			.catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "The learner model could not be loaded."); });
		return () => { cancelled = true; };
	}, [applyWorkspace, targetId]);

	const currentConceptVersions = useMemo(
		() => new Map(workspace?.model?.currentConceptVersions.map((version) => [version.conceptId, version]) ?? []),
		[workspace?.model],
	);

	const semanticChange = async (action: unknown): Promise<LearnerModelView> => {
		setBusy(true);
		setError(null);
		try {
			const response = await fetch(`/api/study/targets/${encodeURIComponent(targetId)}/learner-model`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(action),
			});
			const { model } = await responseJson<{ model: LearnerModelView }>(response);
			const positions: LearnerConceptPosition[] = nodes.map((node) => ({ conceptId: node.id, x: node.position.x, y: node.position.y }));
			const layout: LearnerModelLayoutState = { version: 1, targetId, positions };
			const elements = learnerModelElements(model, layout);
			setWorkspace((current) => current ? { ...current, model, layout } : current);
			setNodes(elements.nodes);
			setEdges(elements.edges);
			return model;
		} finally {
			setBusy(false);
		}
	};

	const saveLayout = useCallback((nextNodes: ConceptNode[]) => {
		const layout: LearnerModelLayoutState = {
			version: 1,
			targetId,
			positions: nextNodes.map((node) => ({ conceptId: node.id, x: node.position.x, y: node.position.y })),
		};
		layoutWrites.current = layoutWrites.current.then(async () => {
			const response = await fetch(`/api/study/targets/${encodeURIComponent(targetId)}/learner-model`, {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(layout),
			});
			const body = await responseJson<{ layout: LearnerModelLayoutState }>(response);
			setWorkspace((current) => current ? { ...current, layout: body.layout } : current);
		}).catch((reason) => setError(reason instanceof Error ? reason.message : "The layout could not be saved."));
	}, [targetId]);

	const onNodesChange = useCallback((changes: NodeChange<ConceptNode>[]) => {
		setNodes((current) => applyNodeChanges(changes, current));
	}, []);

	const onConnect = useCallback((connection: Connection) => {
		if (!connection.source || !connection.target || connection.source === connection.target) return;
		setRelationshipDraft({ relationshipId: null, sourceConceptId: connection.source, targetConceptId: connection.target, label: "" });
	}, []);

	if (!workspace && !error) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading learner map…</div>;
	if (!workspace) return <div role="alert" className="m-6 rounded-xl border border-destructive/50 bg-card p-4 text-sm text-destructive">{error}</div>;

	return (
		<div className="relative h-full min-h-0 overflow-hidden bg-background">
			<div className="absolute left-4 top-4 z-10 w-[min(32rem,calc(100%-2rem))] rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
				<div className="mb-2">
					<p className="font-title text-lg text-foreground">{workspace.target.text}</p>
					<p className="text-xs text-muted-foreground">Build the relationships in your own words. Evaluation and feedback are added in a later stage.</p>
				</div>
				<form className="flex gap-2" onSubmit={(event) => {
					event.preventDefault();
					const label = newConceptRef.current?.value.trim() ?? newConcept.trim();
					if (!label || busy) return;
					void semanticChange({ action: "create_concept", label })
						.then(() => {
							setNewConcept("");
							if (newConceptRef.current) newConceptRef.current.value = "";
						})
						.catch((reason) => setError(reason instanceof Error ? reason.message : "The concept could not be added."));
				}}>
					<input ref={newConceptRef} data-testid="new-concept-input" value={newConcept} onChange={(event) => setNewConcept(event.target.value)} placeholder="Add a concept…" className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm" />
					<button data-testid="add-concept" type="submit" disabled={busy || !newConcept.trim()} className="rounded-lg bg-primary px-3 text-sm text-primary-foreground disabled:opacity-40">Add concept</button>
				</form>
				{error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}
			</div>

			<ReactFlow<ConceptNode, RelationshipEdge>
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onNodeDragStop={(_event, _node, draggedNodes) => {
					const moved = new Map(draggedNodes.map((node) => [node.id, node.position]));
					saveLayout(nodes.map((node) => moved.has(node.id) ? { ...node, position: moved.get(node.id)! } : node));
				}}
				onNodeClick={(_event, node) => {
					setSelectedConceptId(node.id);
					setConceptLabel(currentConceptVersions.get(node.id)?.label ?? "");
					setRelationshipDraft(null);
				}}
				onEdgeClick={(_event, edge) => {
					setSelectedConceptId(null);
					const data = edge.data as { propositionLabel?: string } | undefined;
					setRelationshipDraft({ relationshipId: edge.id, sourceConceptId: edge.source, targetConceptId: edge.target, label: data?.propositionLabel ?? String(edge.label ?? "") });
				}}
				onConnect={onConnect}
				deleteKeyCode={null}
				fitView
				fitViewOptions={{ padding: 0.25, maxZoom: 1.2 }}
				minZoom={0.25}
				maxZoom={2}
				colorMode="dark"
				className="learner-model-flow"
			>
				<Background gap={24} size={1} />
				<Controls showInteractive={false} />
			</ReactFlow>

			{selectedConceptId && (
				<form data-testid="concept-editor" className="absolute bottom-4 right-4 z-10 w-80 max-w-[calc(100%-2rem)] rounded-xl border bg-card p-3 shadow-lg" onSubmit={(event) => {
					event.preventDefault();
					const label = conceptLabel.trim();
					if (!label || busy) return;
					void semanticChange({ action: "revise_concept", conceptId: selectedConceptId, label })
						.then(() => setSelectedConceptId(null))
						.catch((reason) => setError(reason instanceof Error ? reason.message : "The concept could not be revised."));
				}}>
					<label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">Revise concept</label>
					<input value={conceptLabel} onChange={(event) => setConceptLabel(event.target.value)} className="h-9 w-full rounded-lg border bg-background px-3 text-sm" autoFocus />
					<div className="mt-3 flex justify-end gap-2">
						<button type="button" onClick={() => setSelectedConceptId(null)} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent">Cancel</button>
						<button type="submit" disabled={busy || !conceptLabel.trim()} className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-40">Save revision</button>
					</div>
				</form>
			)}

			{relationshipDraft && (
				<form data-testid="relationship-editor" className="absolute bottom-4 right-4 z-10 w-96 max-w-[calc(100%-2rem)] rounded-xl border bg-card p-3 shadow-lg" onSubmit={(event) => {
					event.preventDefault();
					const label = relationshipDraft.label.trim();
					const sourceVersion = currentConceptVersions.get(relationshipDraft.sourceConceptId);
					const targetVersion = currentConceptVersions.get(relationshipDraft.targetConceptId);
					if (!label || !sourceVersion || !targetVersion || busy) return;
					const previous = relationshipDraft.relationshipId ? workspace.model?.currentRelationshipVersions.find((version) => version.relationshipId === relationshipDraft.relationshipId) : null;
					const action = relationshipDraft.relationshipId ? {
						action: "revise_relationship",
						relationshipId: relationshipDraft.relationshipId,
						sourceConceptVersionId: sourceVersion.id,
						targetConceptVersionId: targetVersion.id,
						propositionLabel: label,
						sourceLinks: previous?.sourceLinks ?? [],
					} : {
						action: "create_relationship",
						sourceConceptVersionId: sourceVersion.id,
						targetConceptVersionId: targetVersion.id,
						propositionLabel: label,
					};
					void semanticChange(action)
						.then(() => setRelationshipDraft(null))
						.catch((reason) => setError(reason instanceof Error ? reason.message : "The relationship could not be saved."));
				}}>
					<label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">{relationshipDraft.relationshipId ? "Revise relationship" : "Describe the relationship"}</label>
					<p className="mb-2 text-xs text-muted-foreground">{currentConceptVersions.get(relationshipDraft.sourceConceptId)?.label} → {currentConceptVersions.get(relationshipDraft.targetConceptId)?.label}</p>
					<textarea value={relationshipDraft.label} onChange={(event) => setRelationshipDraft((current) => current ? { ...current, label: event.target.value } : current)} rows={3} placeholder="Why or how are these concepts related?" className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm" autoFocus />
					<div className="mt-3 flex justify-end gap-2">
						<button type="button" onClick={() => setRelationshipDraft(null)} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent">Cancel</button>
						<button type="submit" disabled={busy || !relationshipDraft.label.trim()} className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-40">Save relationship</button>
					</div>
				</form>
			)}
		</div>
	);
}
