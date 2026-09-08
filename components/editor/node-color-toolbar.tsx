import { NodeToolbar, Position, useReactFlow } from "@xyflow/react";

import { NODE_COLORS, type CanvasNode } from "@/types/canvas";

interface NodeColorToolbarProps {
  id: string;
  color: string;
  textColor?: string;
}

export function NodeColorToolbar({ id, color, textColor }: NodeColorToolbarProps) {
  const { updateNodeData } = useReactFlow<CanvasNode>();
  const activeTextColor = textColor ?? NODE_COLORS.find((pair) => pair.color === color)?.textColor;

  return (
    <NodeToolbar
      nodeId={id}
      position={Position.Top}
      offset={14}
      role="group"
      aria-label="Node color themes"
      className="nodrag nopan nowheel flex items-center gap-1 rounded-xl border border-surface-border bg-surface p-1.5 shadow-sm"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
    >
      {NODE_COLORS.map((pair) => (
        <button
          key={pair.name}
          type="button"
          title={pair.name}
          aria-label={`${pair.name} node theme`}
          aria-pressed={color === pair.color && activeTextColor === pair.textColor}
          className="node-color-swatch h-6 w-6 cursor-pointer rounded-full border-2 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          style={{ backgroundColor: pair.color, color: pair.textColor, borderColor: pair.textColor }}
          onClick={() => updateNodeData(id, { color: pair.color, textColor: pair.textColor })}
        />
      ))}
    </NodeToolbar>
  );
}
