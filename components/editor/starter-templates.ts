import { MarkerType } from "@xyflow/react";

import { SHAPE_SIZES } from "@/lib/canvas-shapes";
import { NODE_COLORS, type CanvasEdge, type CanvasNode, type NodeShape } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function node(id: string, label: string, x: number, y: number, shape: NodeShape, palette: number): CanvasNode {
  const { color, textColor } = NODE_COLORS[palette];
  return { id, type: "canvasNode", position: { x, y }, ...SHAPE_SIZES[shape], data: { label, shape, color, textColor } };
}

function edge(source: string, target: string): CanvasEdge {
  return {
    id: `${source}-${target}`, type: "canvasEdge", source, target,
    sourceHandle: "right", targetHandle: "left",
    markerEnd: { type: MarkerType.ArrowClosed, color: "var(--canvas-edge)" },
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices", name: "Microservices",
    description: "Route requests through an API gateway to independent services and their databases.",
    nodes: [
      node("client", "Client", 0, 170, "hexagon", 0),
      node("gateway", "API Gateway", 270, 140, "diamond", 1),
      node("users", "User Service", 550, 20, "pill", 2),
      node("orders", "Order Service", 550, 320, "pill", 7),
      node("users-db", "Users DB", 840, -20, "cylinder", 2),
      node("orders-db", "Orders DB", 840, 280, "cylinder", 7),
    ],
    edges: [edge("client", "gateway"), edge("gateway", "users"), edge("gateway", "orders"), edge("users", "users-db"), edge("orders", "orders-db")],
  },
  {
    id: "ci-cd", name: "CI/CD Pipeline",
    description: "Build and test each commit, approve a release, and deploy it to production.",
    nodes: [
      node("commit", "Commit", 0, 30, "circle", 1),
      node("build", "Build", 220, 40, "rectangle", 2),
      node("test", "Test", 500, 40, "rectangle", 3),
      node("approve", "Approve", 780, 0, "diamond", 7),
      node("deploy", "Deploy", 1060, 50, "pill", 6),
    ],
    edges: [edge("commit", "build"), edge("build", "test"), edge("test", "approve"), edge("approve", "deploy")],
  },
  {
    id: "event-driven", name: "Event-Driven System",
    description: "Publish events to a broker and process them independently with multiple consumers.",
    nodes: [
      node("producer", "Producer", 0, 180, "pill", 1),
      node("broker", "Event Broker", 280, 160, "hexagon", 3),
      node("notify", "Notifications", 570, -20, "pill", 5),
      node("analytics", "Analytics", 570, 180, "rectangle", 2),
      node("archive", "Event Store", 590, 370, "cylinder", 7),
    ],
    edges: [edge("producer", "broker"), edge("broker", "notify"), edge("broker", "analytics"), edge("broker", "archive")],
  },
];
