import { get, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getAccessibleProject } from "@/lib/project-access";
import { isCanvasSnapshot } from "@/lib/canvas-snapshot";

interface Context { params: Promise<{ projectId: string }> }
async function authorize(projectId: string) {
  const identity = await getCurrentIdentity();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!await getAccessibleProject(projectId, identity)) return Response.json({ error: "Project not found" }, { status: 404 });
}
const failure = () => Response.json({ error: "Unable to persist or load canvas" }, { status: 500 });

export async function PUT(request: Request, { params }: Context) {
  try {
    const { projectId } = await params;
    const denied = await authorize(projectId);
    if (denied) return denied;
    let body: unknown;
    try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    if (!isCanvasSnapshot(body)) return Response.json({ error: "Invalid canvas snapshot" }, { status: 400 });
    const blob = await put(`canvas/${encodeURIComponent(projectId)}.json`, JSON.stringify(body), {
      access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true,
    });
    await prisma.project.update({ where: { id: projectId }, data: { canvasJsonPath: blob.url } });
    return Response.json({ success: true });
  } catch { return failure(); }
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const { projectId } = await params;
    const denied = await authorize(projectId);
    if (denied) return denied;
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { canvasJsonPath: true } });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    if (!project.canvasJsonPath) return Response.json({ canvas: null }, { headers: { "Cache-Control": "no-store" } });
    const blob = await get(project.canvasJsonPath, { access: "private", useCache: false });
    if (!blob || blob.statusCode !== 200) return failure();
    const canvas: unknown = await new Response(blob.stream).json();
    if (!isCanvasSnapshot(canvas)) return failure();
    return Response.json({ canvas }, { headers: { "Cache-Control": "no-store" } });
  } catch { return failure(); }
}
