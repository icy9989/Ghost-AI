import type { Edge, Node } from "@xyflow/react";

export const NODE_SHAPES = [
  "rectangle", "diamond", "circle", "pill", "cylinder", "hexagon",
] as const;

export type NodeShape = (typeof NODE_SHAPES)[number];

export const NODE_COLORS = [
  { name: "Neutral", color: "#1F1F1F", textColor: "var(--node-text-default)" },
  { name: "Blue", color: "#10233D", textColor: "#52A8FF" },
  { name: "Purple", color: "#2E1938", textColor: "#BF7AF0" },
  { name: "Orange", color: "#331B00", textColor: "#FF990A" },
  { name: "Red", color: "#3C1618", textColor: "#FF6166" },
  { name: "Pink", color: "#3A1726", textColor: "#F75F8F" },
  { name: "Green", color: "#0F2E18", textColor: "#62C073" },
  { name: "Teal", color: "#062822", textColor: "#0AC7B4" },
] as const;

export const DEFAULT_NODE_COLOR = NODE_COLORS[0].color;

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: string;
  // Older collaborative nodes only stored the background color.
  textColor?: string;
  shape: NodeShape;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;
export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
}

export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">;
