import type { ReactNode } from "react";

import { NODE_COLORS, type NodeShape } from "@/types/canvas";

interface NodeShapeProps {
  shape: NodeShape;
  color: string;
  textColor?: string;
  selected?: boolean;
  children?: ReactNode;
}

export function NodeShapeVisual({ shape, color, textColor, selected = false, children }: NodeShapeProps) {
  const isSvg = shape === "diamond" || shape === "hexagon" || shape === "cylinder";
  const borderColor = selected ? "var(--accent-primary)" : "var(--border-subtle)";

  return (
    <div
      className="relative h-full w-full text-center text-sm"
      style={{ color: textColor ?? NODE_COLORS.find((pair) => pair.color === color)?.textColor ?? NODE_COLORS[0].textColor }}
    >
      {isSvg ? (
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill={color}
          stroke={borderColor}
          strokeWidth={1}
        >
          {shape === "diamond" && <polygon points="50,1 99,50 50,99 1,50" vectorEffect="non-scaling-stroke" />}
          {shape === "hexagon" && <polygon points="25,1 75,1 99,50 75,99 25,99 1,50" vectorEffect="non-scaling-stroke" />}
          {shape === "cylinder" && (
            <>
              <path d="M 1 13 A 49 12 0 0 1 99 13 L 99 87 A 49 12 0 0 1 1 87 Z" vectorEffect="non-scaling-stroke" />
              <ellipse cx="50" cy="13" rx="49" ry="12" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>
      ) : (
        <div
          aria-hidden="true"
          className={`absolute inset-0 border ${shape === "rectangle" ? "rounded-xl" : shape === "circle" ? "rounded-[50%]" : "rounded-full"}`}
          style={{ backgroundColor: color, borderColor }}
        />
      )}
      <div className={`relative flex h-full w-full items-center justify-center break-words whitespace-pre-wrap ${shape === "diamond" ? "p-[25%]" : shape === "hexagon" || shape === "circle" ? "px-[20%] py-[15%]" : shape === "cylinder" ? "px-3 py-[20%]" : "p-3"}`}>
        {children}
      </div>
    </div>
  );
}
