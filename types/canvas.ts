import type { Edge, Node } from "@xyflow/react";

export const NODE_SHAPES = [
  "rectangle", "diamond", "circle", "pill", "cylinder", "hexagon",
] as const;

export type NodeShape = (typeof NODE_SHAPES)[number];

export const DEFAULT_NODE_COLOR = "#1F1F1F";

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: string;
  shape: NodeShape;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export type CanvasEdge = Edge<Record<string, unknown>, "canvasEdge">;
