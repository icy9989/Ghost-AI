"use client";

import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { useRef, type DragEvent } from "react";
import { Background, BackgroundVariant, ConnectionMode, MiniMap, ReactFlow, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import { CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";
import { createShapeNode, parseShapePayload, SHAPE_DRAG_TYPE } from "@/lib/canvas-shapes";

const nodeTypes = { canvasNode: CanvasNodeRenderer };

export function Canvas() {
  const flow = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const payload = parseShapePayload(event.dataTransfer.getData(SHAPE_DRAG_TYPE));
    if (!payload || !flow.current) return;
    const position = flow.current.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    onNodesChange([{ type: "add", item: createShapeNode(payload, position) }]);
  }

  return (
    <div className="relative h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow<CanvasNode, CanvasEdge>
        nodeTypes={nodeTypes}
        onInit={(instance) => { flow.current = instance; }}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        fitView
      >
        <MiniMap bgColor="var(--bg-surface)" nodeColor="var(--bg-elevated)" maskColor="var(--bg-base)" />
        <Background variant={BackgroundVariant.Dots} color="var(--border-default)" bgColor="var(--bg-base)" />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}
