import { Prisma } from "@/lib/generated/prisma/client";

async function readProjectInput(request: Request, defaultName?: string) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Expected a JSON object" }, { status: 400 });
  }

  const name = "name" in body ? body.name : defaultName;
  if (typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Name must be a non-empty string" }, { status: 400 });
  }

  return { body, name: name.trim() };
}

export async function readProjectName(request: Request, defaultName?: string) {
  const input = await readProjectInput(request, defaultName);
  return input instanceof Response ? input : input.name;
}

export async function readProjectCreate(request: Request) {
  const input = await readProjectInput(request, "Untitled Project");
  if (input instanceof Response) return input;
  const roomId = "roomId" in input.body ? input.body.roomId : undefined;
  if (roomId !== undefined && (typeof roomId !== "string" || roomId.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*-[a-f0-9]{12}$/.test(roomId))) {
    return Response.json({ error: "Invalid room ID" }, { status: 400 });
  }
  return { name: input.name, ...(typeof roomId === "string" && { id: roomId }) };
}

export function projectApiError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return Response.json({ error: "This room ID already exists. Reopen the create dialog to try again." }, { status: 409 });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  console.error("Project API request failed", error);
  return Response.json({ error: "Unable to complete project request" }, { status: 500 });
}
