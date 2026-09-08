"use client";

import { Component, useState, type ReactNode } from "react";
import { ClientSideSuspense, LiveblocksProvider, RoomProvider, useErrorListener } from "@liveblocks/react/suspense";

import { Canvas, type CanvasProps } from "@/components/editor/canvas";

function CanvasError() {
  return <p role="alert" className="flex h-full items-center justify-center p-6 text-center text-sm text-copy-muted">Unable to connect to the canvas. Please reload to try again.</p>;
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? <CanvasError /> : this.props.children;
  }
}

function RoomCanvas(props: CanvasProps) {
  const [hasConnectionError, setHasConnectionError] = useState(false);

  // Keep the listener outside suspense so authentication failures replace loading.
  useErrorListener((error) => {
    if (error.context.type === "ROOM_CONNECTION_ERROR") {
      setHasConnectionError(true);
    }
  });

  if (hasConnectionError) return <CanvasError />;

  return (
    <ClientSideSuspense fallback={<p role="status" className="flex h-full items-center justify-center text-sm text-copy-muted">Loading canvas…</p>}>
      <Canvas {...props} />
    </ClientSideSuspense>
  );
}

export function CanvasRoom({ roomId, ...props }: CanvasProps & { roomId: string }) {
  return (
    <CanvasErrorBoundary key={roomId}>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
          <RoomCanvas {...props} />
        </RoomProvider>
      </LiveblocksProvider>
    </CanvasErrorBoundary>
  );
}
