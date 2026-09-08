"use client";

import { useAuth } from "@clerk/nextjs";
import { shallow, useOthersMapped } from "@liveblocks/react/suspense";
import { useViewport } from "@xyflow/react";

import { getPresenceColor } from "@/lib/presence";

export function CanvasCursors() {
  const { userId } = useAuth();
  const viewport = useViewport();
  const others = useOthersMapped((other) => ({ id: other.id, info: other.info, cursor: other.presence.cursor }), shallow);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {others.map(([connectionId, other]) => {
        if (!userId || other.id === userId || !other.cursor) return null;
        const { x, y } = other.cursor;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        const color = other.info?.color || getPresenceColor(other.id);

        return (
          <div key={connectionId} className="absolute left-0 top-0" style={{ transform: `translate(${x * viewport.zoom + viewport.x}px, ${y * viewport.zoom + viewport.y}px)`, color }}>
            <svg width="18" height="22" viewBox="0 0 18 22" fill="currentColor">
              <path d="M1 1L16 13L9 14L6 21Z" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span className="absolute left-4 top-4 max-w-40 truncate rounded-xl px-2 py-1 text-xs font-medium" style={{ backgroundColor: color, color: "var(--bg-base)" }}>{other.info?.name || "Collaborator"}</span>
          </div>
        );
      })}
    </div>
  );
}
