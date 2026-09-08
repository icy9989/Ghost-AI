import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";

import { getAccessibleProject, getCurrentIdentity } from "@/lib/project-access";
import { getPresenceColor } from "@/lib/presence";

export async function POST(request: Request) {
  try {
    const identity = await getCurrentIdentity();
    if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let data: unknown;
    try {
      data = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (
      !data || typeof data !== "object" || !("room" in data) ||
      typeof data.room !== "string" || !data.room.trim() ||
      data.room.length > 128 || data.room.includes("*")
    ) {
      return Response.json({ error: "A valid room ID is required" }, { status: 400 });
    }

    const project = await getAccessibleProject(data.room, identity);
    if (!project) return Response.json({ error: "Forbidden" }, { status: 403 });

    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) {
      return Response.json({ error: "Liveblocks authentication is not configured" }, { status: 503 });
    }

    const liveblocks = new Liveblocks({ secret });
    const user = await currentUser();
    if (!user || user.id !== identity.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = liveblocks.prepareSession(identity.userId, {
      userInfo: {
        name: user.fullName || user.username || "Collaborator",
        ...(user.hasImage ? { avatar: user.imageUrl } : {}),
        color: getPresenceColor(identity.userId),
      },
    });
    session.allow(project.id, session.FULL_ACCESS);
    const { body, status } = await session.authorize();
    if (status !== 200) {
      return Response.json({ error: "Unable to authorize the canvas connection" }, { status: 502 });
    }
    return new Response(body, {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Unable to authenticate the canvas connection" }, { status: 500 });
  }
}
