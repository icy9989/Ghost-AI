"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { isCanvasSnapshot, serializeCanvas, type CanvasSnapshot, type CanvasSaveStatus } from "@/lib/canvas-snapshot";

interface Options extends CanvasSnapshot {
  projectId: string;
  hasContent: () => boolean;
  restore: (canvas: CanvasSnapshot) => void;
  onStatus?: (status: CanvasSaveStatus) => void;
  saveRequest?: number;
}

export function useCanvasAutosave({ projectId, nodes, edges, hasContent, restore, onStatus, saveRequest = 0 }: Options) {
  const serialized = serializeCanvas({ nodes, edges });
  const update = useRef<(() => void) | null>(null);
  const latest = useEffectEvent(() => ({ serialized, hasContent, restore, onStatus }));

  useEffect(() => {
    let disposed = false, ready = false, busy = false;
    let saved: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const url = `/api/projects/${encodeURIComponent(projectId)}/canvas`;
    const status = (value: CanvasSaveStatus) => { if (!disposed) latest().onStatus?.(value); };
    async function save() {
      if (disposed || !ready || busy) return;
      const body = latest().serialized;
      if (body === saved) { status("saved"); return; }
      busy = true;
      status("saving");
      try {
        const response = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body, signal: controller.signal });
        if (!response.ok) throw new Error("Save failed");
        saved = body;
        status(latest().serialized === saved ? "saved" : "saving");
      } catch { status("error"); }
      finally {
        busy = false;
        if (!disposed && saved === body && latest().serialized !== saved) schedule();
      }
    }
    function schedule() {
      clearTimeout(timer);
      if (!ready || disposed) return;
      if (latest().serialized !== saved) {
        status("saving");
        timer = setTimeout(() => { void save(); }, 1000);
      }
    }
    async function initialize() {
      status("saving");
      try {
        // Never fetch saved state for an already populated collaborative room.
        if (!latest().hasContent()) {
          const response = await fetch(url, { cache: "no-store", signal: controller.signal });
          if (!response.ok) throw new Error("Load failed");
          const result: unknown = await response.json();
          if (typeof result !== "object" || result === null || !("canvas" in result) ||
            (result.canvas !== null && !isCanvasSnapshot(result.canvas))) throw new Error("Invalid snapshot");
          if (disposed) return;
          if (!latest().hasContent()) {
            saved = result.canvas === null ? latest().serialized : serializeCanvas(result.canvas);
            if (result.canvas !== null) latest().restore(result.canvas);
          }
        }
        ready = true;
        // Restoration updates React on the next render. Do not save the old empty render.
        if (saved === null) schedule();
        else status("saved");
      } catch { status("error"); }
    }
    update.current = () => {
      if (!ready) { if (!busy) { busy = true; void initialize().finally(() => { busy = false; }); } }
      else schedule();
    };
    busy = true;
    void initialize().finally(() => { busy = false; });
    return () => { disposed = true; clearTimeout(timer); controller.abort(); update.current = null; };
  }, [projectId]);

  useEffect(() => { update.current?.(); }, [serialized, saveRequest]);
}
