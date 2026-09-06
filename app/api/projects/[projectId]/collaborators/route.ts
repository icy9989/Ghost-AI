import { getAccessibleProject, getCurrentIdentity } from "@/lib/project-access";
import { enrichCollaborators, readCollaboratorEmail } from "@/lib/collaborators";
import { prisma } from "@/lib/prisma";

interface Context { params: Promise<{ projectId: string }> }

async function access(context: Context, ownerOnly = false) {
  const identity = await getCurrentIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { projectId } = await context.params;
  const project = await getAccessibleProject(projectId, identity);
  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  if (ownerOnly && !project.isOwner) return Response.json({ error: "Forbidden" }, { status: 403 });
  return { projectId, isOwner: project.isOwner, userId: identity.userId };
}

function failed() {
  return Response.json({ error: "Unable to update or load collaborators. Please try again." }, { status: 500 });
}

export async function GET(_request: Request, context: Context) {
  try {
    const result = await access(context);
    if (result instanceof Response) return result;
    const rows = await prisma.projectCollaborator.findMany({ where: { projectId: result.projectId }, select: { email: true }, orderBy: { email: "asc" } });
    return Response.json({ collaborators: await enrichCollaborators(rows), isOwner: result.isOwner }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return failed(); }
}

async function mutate(request: Request, context: Context, remove: boolean) {
  try {
    const result = await access(context, true);
    if (result instanceof Response) return result;
    const email = await readCollaboratorEmail(request);
    if (!email) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
    // Scope the write to the owner again, including if the project changed after the access check.
    await prisma.project.update({
      where: { id: result.projectId, ownerId: result.userId },
      data: { collaborators: remove
        ? { deleteMany: { email: { equals: email, mode: "insensitive" } } }
        : { upsert: { where: { projectId_email: { projectId: result.projectId, email } }, create: { email }, update: {} } } },
    });
    return Response.json({ success: true });
  } catch { return failed(); }
}

export async function POST(request: Request, context: Context) { return mutate(request, context, false); }
export async function DELETE(request: Request, context: Context) { return mutate(request, context, true); }
