import { useEffect, useRef, useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from "@xyflow/react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export function CanvasEdgeRenderer(props: EdgeProps<CanvasEdge>) {
  const { id, data, selected, markerEnd, markerStart } = props;
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>();
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const label = data?.label ?? "";
  const active = hovered || selected || editing;
  const [path, labelX, labelY] = getSmoothStepPath({ ...props, borderRadius: 6 });

  useEffect(() => {
    if (editing) {
      input.current?.focus({ preventScroll: true });
      input.current?.select();
    }
  }, [editing]);

  function startEditing() {
    setDraft(label);
    setEditing(true);
  }

  function saveLabel() {
    updateEdgeData(id, { label: draft });
    setEditing(false);
  }

  return (
    <>
      <g
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={(event) => { event.stopPropagation(); startEditing(); }}
        style={{ opacity: active ? 1 : 0.6, transition: "opacity 150ms" }}
      >
        <BaseEdge id={id} path={path} markerEnd={markerEnd} markerStart={markerStart} interactionWidth={24} />
      </g>
      <EdgeLabelRenderer>
        {(label || active) && (
          <div
            className="nodrag nopan nowheel absolute rounded-xl border border-surface-border bg-surface px-2 py-1 text-xs text-copy-primary"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: "all" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => { event.stopPropagation(); if (!editing) startEditing(); }}
            onKeyDown={(event) => event.stopPropagation()}
            onKeyUp={(event) => event.stopPropagation()}
          >
            {editing ? (
              <span className="grid">
                <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-pre">{draft || "Add label"}{"\u00a0"}</span>
                <input
                  ref={input}
                  aria-label="Edge label"
                  className="nodrag nopan nowheel col-start-1 row-start-1 w-full min-w-0 border-0 bg-transparent p-0 text-inherit outline-none placeholder:text-copy-faint"
                  value={draft}
                  placeholder="Add label"
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={saveLabel}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if (!event.nativeEvent.isComposing && (event.key === "Enter" || event.key === "Escape")) {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                />
              </span>
            ) : (
              <button type="button" aria-label="Edit edge label" className={`block cursor-text whitespace-pre ${label ? "" : "text-copy-faint"}`} onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "F2") { event.preventDefault(); startEditing(); }
              }}>
                {label || "Add label"}
              </button>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
