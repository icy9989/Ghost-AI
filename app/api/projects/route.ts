import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { projectApiError, readProjectCreate } from "@/lib/project-api";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const projects = await prisma.project.findMany({ where: { ownerId: userId } });
    return Response.json({ projects });
  } catch (error) {
    return projectApiError(error);
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = await readProjectCreate(request);
  if (data instanceof Response) return data;

  try {
    const project = await prisma.project.create({ data: { ...data, ownerId: userId } });
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    return projectApiError(error);
  }
}
