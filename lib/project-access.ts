import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { ProjectSummary } from "@/lib/project";

export interface ProjectIdentity {
  userId: string;
  primaryEmail: string | null;
}

export async function getCurrentIdentity(): Promise<ProjectIdentity | null> {
  const user = await currentUser();
  if (!user) return null;
  const email = user.primaryEmailAddress;
  return {
    userId: user.id,
    primaryEmail: email?.verification?.status === "verified" ? email.emailAddress : null,
  };
}

export async function getAccessibleProject(roomId: string, identity: ProjectIdentity): Promise<ProjectSummary | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: roomId,
      OR: [
        { ownerId: identity.userId },
        ...(identity.primaryEmail ? [{ collaborators: { some: { email: { equals: identity.primaryEmail, mode: "insensitive" as const } } } }] : []),
      ],
    },
    select: { id: true, name: true, ownerId: true },
  });
  return project ? { id: project.id, name: project.name, isOwner: project.ownerId === identity.userId } : null;
}
