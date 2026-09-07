import { useEffect, useRef, useState } from "react";
import { Handle, NodeResizer, Position, useReactFlow, useUpdateNodeInternals, type NodeProps } from "@xyflow/react";

import type { CanvasNode } from "@/types/canvas";
import { NodeShapeVisual } from "@/components/editor/node-shape";
import { NodeColorToolbar } from "@/components/editor/node-color-toolbar";

export function CanvasNodeRenderer({ id, data, selected, isConnectable, width, height }: NodeProps<CanvasNode>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const { updateNodeData } = useReactFlow<CanvasNode>();
  const [editing, setEditing] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      textarea.current?.focus({ preventScroll: true });
      textarea.current?.select();
    }
  }, [editing]);

  // Existing nodes can retain empty handle bounds after handles are added.
  // Force measurement once the handles are mounted so edges have endpoints.
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data.shape, width, height, updateNodeInternals]);

  return (
    <div className="group relative h-full w-full">
      <NodeColorToolbar id={id} selected={selected} color={data.color} textColor={data.textColor} />
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={60}
        color="var(--accent-primary)"
        handleStyle={{ width: 6, height: 6, borderRadius: 2, background: "var(--bg-surface)", border: "1px solid var(--accent-primary)" }}
        lineStyle={{ opacity: 0.4 }}
      />
      <NodeShapeVisual shape={data.shape} color={data.color} textColor={data.textColor} selected={selected}>
        <div className="relative max-h-full w-full min-w-0 overflow-hidden leading-5">
          <button
            type="button"
            aria-label="Edit node label"
            tabIndex={editing ? -1 : 0}
            className={`nodrag nopan block min-h-5 w-full cursor-text border-0 bg-transparent p-0 text-center text-inherit [overflow-wrap:anywhere] whitespace-pre-wrap outline-none ${editing ? "invisible" : ""} ${data.label ? "" : "opacity-70"}`}
            onDoubleClick={(event) => {
              event.stopPropagation();
              setEditing(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "F2") {
                event.preventDefault();
                event.stopPropagation();
                setEditing(true);
              }
            }}
          >
            {data.label ? `${data.label}\u200b` : "Add label"}
          </button>
          {editing && (
            <textarea
              ref={textarea}
              aria-label="Node label"
              placeholder="Add label"
              value={data.label}
              className="nodrag nopan nowheel absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-0 text-center leading-5 text-inherit outline-none [overflow-wrap:anywhere] placeholder:text-current placeholder:opacity-70"
              onChange={(event) => updateNodeData(id, { label: event.target.value })}
              onBlur={() => setEditing(false)}
              onPointerDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.currentTarget.blur();
                }
              }}
              onKeyUp={(event) => event.stopPropagation()}
            />
          )}
        </div>
      </NodeShapeVisual>
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((position) => (
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          isConnectable={isConnectable}
          aria-label={`Connect from ${position}`}
          className="opacity-0 transition-opacity group-hover:opacity-100 [&.connecting]:opacity-100 [&.valid]:opacity-100"
          style={{ width: 8, height: 8, background: "var(--canvas-edge)", border: "2px solid var(--bg-base)" }}
        />
      ))}
    </div>
  );
}
