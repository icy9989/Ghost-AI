"use client";

import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useRoom } from "@liveblocks/react/suspense";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Background, BackgroundVariant, ConnectionLineType, ConnectionMode, MarkerType, ReactFlow, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { ShapePanel } from "@/components/editor/shape-panel";
import { CanvasControls } from "@/components/editor/canvas-controls";
import { createShapeNode, parseShapePayload, SHAPE_DRAG_TYPE } from "@/lib/canvas-shapes";

import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { CanvasTemplate } from "@/components/editor/starter-templates";

const nodeTypes = { canvasNode: CanvasNodeRenderer };
const edgeStyle = { stroke: "var(--canvas-edge)", strokeWidth: 2 };
const edgeTypes = { canvasEdge: CanvasEdgeRenderer, default: CanvasEdgeRenderer };
const defaultEdgeOptions = {
  type: "canvasEdge",
  style: edgeStyle,
  markerEnd: { type: MarkerType.ArrowClosed, color: "var(--canvas-edge)" },
};

export interface CanvasProps {
  templatesOpen: boolean;
  onTemplatesOpenChange: (open: boolean) => void;
}

export function Canvas({ templatesOpen, onTemplatesOpenChange }: CanvasProps) {
  const room = useRoom();
  const pendingFit = useRef<string[] | null>(null);
  const [flow, setFlow] = useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  useEffect(() => {
    const ids = pendingFit.current;
    if (!flow || !ids || !ids.every((id) => nodes.some((node) => node.id === id))) return;
    const frame = requestAnimationFrame(() => {
      void flow.fitView({ nodes: ids.map((id) => ({ id })), padding: 0.2, duration: 200 });
      pendingFit.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [flow, nodes]);

  function importTemplate(template: CanvasTemplate) {
    // Each import owns fresh IDs and data, including when the same template is reused.
    const prefix = crypto.randomUUID();
    const importedNodes = template.nodes.map((node) => ({ ...structuredClone(node), id: `${prefix}-${node.id}` }));
    const importedEdges = template.edges.map((edge) => ({
      ...structuredClone(edge), id: `${prefix}-${edge.id}`,
      source: `${prefix}-${edge.source}`, target: `${prefix}-${edge.target}`,
    }));
    pendingFit.current = importedNodes.map((node) => node.id);
    room.batch(() => {
      // Liveblocks ignores remove changes; its deletion handler clears storage.
      onDelete({ nodes, edges });
      onNodesChange(importedNodes.map((item) => ({ type: "add", item })));
      onEdgesChange(importedEdges.map((item) => ({ type: "add", item })));
    });
  }

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const payload = parseShapePayload(event.dataTransfer.getData(SHAPE_DRAG_TYPE));
    if (!payload || !flow) return;
    const position = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    onNodesChange([{ type: "add", item: createShapeNode(payload, position) }]);
  }

  return (
    <div className="relative h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow<CanvasNode, CanvasEdge>
        className="editor-canvas"
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={setFlow}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={edgeStyle}
        connectionLineType={ConnectionLineType.SmoothStep}
        colorMode="dark"
        fitView
      >
        <Background variant={BackgroundVariant.Dots} color="var(--border-default)" bgColor="var(--bg-base)" />
      </ReactFlow>
      <CanvasControls flow={flow} />
      <ShapePanel />
      <StarterTemplatesModal open={templatesOpen} onOpenChange={onTemplatesOpenChange} onImport={importTemplate} />
    </div>
  );
}
