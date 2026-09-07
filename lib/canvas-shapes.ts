import { DEFAULT_NODE_COLOR, NODE_COLORS, NODE_SHAPES, type CanvasNode, type NodeShape } from "@/types/canvas";

export const SHAPE_DRAG_TYPE = "application/ghost-ai-shape";

export interface ShapePayload {
  shape: NodeShape;
  width: number;
  height: number;
}

export const SHAPE_SIZES: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 180, height: 100 },
  diamond: { width: 180, height: 180 },
  circle: { width: 120, height: 120 },
  pill: { width: 180, height: 80 },
  cylinder: { width: 140, height: 160 },
  hexagon: { width: 180, height: 120 },
};

export function parseShapePayload(raw: string): ShapePayload | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const { shape, width, height } = value as Record<string, unknown>;
    if (!NODE_SHAPES.some((name) => name === shape)) return null;
    if (typeof width !== "number" || !Number.isFinite(width) || width <= 0) return null;
    if (typeof height !== "number" || !Number.isFinite(height) || height <= 0) return null;
    return { shape: shape as NodeShape, width, height };
  } catch {
    return null;
  }
}

let nodeCounter = 0;

export function createShapeNode(payload: ShapePayload, position: CanvasNode["position"]): CanvasNode {
  return {
    id: `${payload.shape}-${Date.now()}-${++nodeCounter}`,
    type: "canvasNode",
    position,
    width: payload.width,
    height: payload.height,
    data: { label: "", color: DEFAULT_NODE_COLOR, textColor: NODE_COLORS[0].textColor, shape: payload.shape },
  };
}
