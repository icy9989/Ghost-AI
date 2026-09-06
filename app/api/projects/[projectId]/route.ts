import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { projectApiError, readProjectName } from "@/lib/project-api";

interface ProjectRouteContext {
  params: Promise<{ projectId: string }>;
}

async function checkOwner(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await context.params;
  try {
    const denied = await checkOwner(projectId, userId);
    if (denied) return denied;

    const name = await readProjectName(request);
    if (name instanceof Response) return name;

    const project = await prisma.project.update({
      where: { id: projectId, ownerId: userId },
      data: { name },
    });
    return Response.json({ project });
  } catch (error) {
    return projectApiError(error);
  }
}

export async function DELETE(_request: Request, context: ProjectRouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await context.params;
  try {
    const denied = await checkOwner(projectId, userId);
    if (denied) return denied;

    await prisma.project.delete({ where: { id: projectId, ownerId: userId } });
    return Response.json({ success: true });
  } catch (error) {
    return projectApiError(error);
  }
}
