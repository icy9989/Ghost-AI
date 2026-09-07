"use client";

import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react/suspense";
import type { ReactFlowInstance } from "@xyflow/react";
import { Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CANVAS_ZOOM_OPTIONS, useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

interface CanvasControlsProps {
  flow: ReactFlowInstance<CanvasNode, CanvasEdge> | null;
}

export function CanvasControls({ flow }: CanvasControlsProps) {
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useKeyboardShortcuts(flow, undo, redo);

  const buttonClass = "rounded-full text-copy-secondary disabled:opacity-40";

  return (
    <div
      role="group"
      aria-label="Canvas controls"
      className="absolute bottom-24 left-6 z-10 flex items-center gap-2 rounded-full border border-surface-border bg-surface p-2 shadow-lg"
      onDrop={(event) => event.stopPropagation()}
    >
      <div role="group" aria-label="Zoom controls" className="flex gap-1">
        <Button type="button" variant="ghost" size="icon-lg" className={buttonClass} aria-label="Zoom out" title="Zoom out (-)" disabled={!flow} onClick={() => void flow?.zoomOut(CANVAS_ZOOM_OPTIONS)}>
          <Minus className="size-5" aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon-lg" className={buttonClass} aria-label="Fit view" title="Fit view" disabled={!flow} onClick={() => void flow?.fitView(CANVAS_ZOOM_OPTIONS)}>
          <Maximize className="size-5" aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon-lg" className={buttonClass} aria-label="Zoom in" title="Zoom in (+ or =)" disabled={!flow} onClick={() => void flow?.zoomIn(CANVAS_ZOOM_OPTIONS)}>
          <Plus className="size-5" aria-hidden="true" />
        </Button>
      </div>
      <div aria-hidden="true" className="h-6 w-px bg-surface-border" />
      <div role="group" aria-label="History controls" className="flex gap-1">
        <Button type="button" variant="ghost" size="icon-lg" className={buttonClass} aria-label="Undo" title="Undo (Cmd/Ctrl + Z)" disabled={!canUndo} onClick={undo}>
          <Undo2 className="size-5" aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon-lg" className={buttonClass} aria-label="Redo" title="Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)" disabled={!canRedo} onClick={redo}>
          <Redo2 className="size-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
