"use client";

import { useState } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { shallow, useOthersMapped } from "@liveblocks/react/suspense";

import { getInitials, getPresenceColor } from "@/lib/presence";

function CollaboratorAvatar({ name, avatar, color }: { name: string; avatar?: string; color: string }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);

  return (
    <span role="img" aria-label={name} title={name} className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-xs font-semibold ring-2 ring-surface-border" style={{ color }}>
      {avatar && failedImage !== avatar ? (
        // Clerk profile URLs are dynamic; keep this display-only image unoptimized.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" draggable={false} className="size-full object-cover" onError={() => setFailedImage(avatar)} />
      ) : getInitials(name)}
    </span>
  );
}

export function CanvasPresence() {
  const { userId } = useAuth();
  // Subscribe to identity metadata only, so cursor movement does not rerender avatars.
  const others = useOthersMapped((other) => ({ id: other.id, info: other.info }), shallow);
  const collaborators = Array.from(new Map(others
    .filter(([, other]) => userId && other.id !== userId)
    .map(([, other]) => [other.id, other])).values());

  return (
    <div aria-label="Room participants" className="absolute right-4 top-4 z-20 flex items-center gap-3 rounded-2xl border border-surface-border bg-surface/90 p-2 shadow-sm">
      {collaborators.length > 0 && <>
        <div className="flex items-center -space-x-2">
          {collaborators.slice(0, 5).map((other) => (
            <CollaboratorAvatar key={other.id} name={other.info?.name || "Collaborator"} avatar={other.info?.avatar} color={other.info?.color || getPresenceColor(other.id)} />
          ))}
          {collaborators.length > 5 && (
            <span aria-label={`${collaborators.length - 5} more collaborators`} className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-elevated text-xs font-medium text-copy-secondary ring-2 ring-surface-border">+{collaborators.length - 5}</span>
          )}
        </div>
        <span aria-hidden="true" className="h-6 w-px bg-surface-border" />
      </>}
      <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />
    </div>
  );
}
