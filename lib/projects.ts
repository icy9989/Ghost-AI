import "server-only";

import { getCurrentIdentity, type ProjectIdentity } from "@/lib/project-access";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ProjectSummary } from "@/lib/project";

export async function getProjects(currentIdentity?: ProjectIdentity) {
  const identity = currentIdentity ?? await getCurrentIdentity();
  if (!identity) redirect("/sign-in");
  const emails = identity.primaryEmail ? [identity.primaryEmail] : [];
  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: identity.userId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: {
        ownerId: { not: identity.userId },
        collaborators: { some: { OR: emails.map((email) => ({ email: { equals: email, mode: "insensitive" as const } })) } },
      },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    ownedProjects: owned.map((project): ProjectSummary => ({ ...project, isOwner: true })),
    sharedProjects: shared.map((project): ProjectSummary => ({ ...project, isOwner: false })),
  };
}
