import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ProjectSummary } from "@/lib/project";

export async function getProjects() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const emails = user.emailAddresses
    .filter((email) => email.verification?.status === "verified")
    .map((email) => email.emailAddress);
  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: {
        ownerId: { not: user.id },
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
