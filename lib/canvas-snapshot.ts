import { NODE_SHAPES, type CanvasNode, type CanvasEdge } from "@/types/canvas";

export interface CanvasSnapshot { nodes: CanvasNode[]; edges: CanvasEdge[] }
export type CanvasSaveStatus = "saving" | "saved" | "error";
const record = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (!record(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return false;
  const ids = new Set<string>();
  for (const node of value.nodes) {
    if (!record(node) || typeof node.id !== "string" || !node.id || ids.has(node.id) || node.type !== "canvasNode" ||
      !record(node.position) || !Number.isFinite(node.position.x) || !Number.isFinite(node.position.y) ||
      !record(node.data) || typeof node.data.label !== "string" || typeof node.data.color !== "string" ||
      !NODE_SHAPES.includes(node.data.shape as typeof NODE_SHAPES[number]) ||
      (node.data.textColor !== undefined && typeof node.data.textColor !== "string") ||
      [node.width, node.height].some(size => size !== undefined && (typeof size !== "number" || !Number.isFinite(size) || size <= 0))) return false;
    ids.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of value.edges) {
    if (!record(edge) || typeof edge.id !== "string" || !edge.id || edgeIds.has(edge.id) ||
      typeof edge.source !== "string" || typeof edge.target !== "string" || !ids.has(edge.source) || !ids.has(edge.target) ||
      (edge.type !== undefined && edge.type !== "canvasEdge" && edge.type !== "default") ||
      (edge.data !== undefined && (!record(edge.data) || (edge.data.label !== undefined && typeof edge.data.label !== "string")))) return false;
    edgeIds.add(edge.id);
  }
  return true;
}

export function serializeCanvas({ nodes, edges }: CanvasSnapshot): string {
  // Interaction and measurement state is local to a viewer, not diagram content.
  const clean = (item: CanvasNode | CanvasEdge) => Object.fromEntries(Object.entries(item).filter(([key]) =>
    !["selected", "dragging", "resizing", "measured", "positionAbsolute"].includes(key)));
  return JSON.stringify({ nodes: nodes.map(clean), edges: edges.map(clean) });
}
