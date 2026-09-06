import type { NodeProps } from "@xyflow/react";

import type { CanvasNode } from "@/types/canvas";

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-xl border p-3 text-center text-sm break-words whitespace-pre-wrap text-[var(--node-text-default)] ${selected ? "border-brand" : "border-surface-border-subtle"}`}
      style={{ backgroundColor: data.color }}
    >
      {data.label}
    </div>
  );
}
