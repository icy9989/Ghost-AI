import { redirect } from "next/navigation";
import { AccessDenied } from "@/components/editor/access-denied";
import { EditorShell } from "@/components/editor/editor-shell";
import { getAccessibleProject, getCurrentIdentity } from "@/lib/project-access";
import { getProjects } from "@/lib/projects";

export default async function WorkspacePage({ params }: { params: Promise<{ roomId: string }> }) {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/sign-in");
  const { roomId } = await params;
  const activeProject = await getAccessibleProject(roomId, identity);
  if (!activeProject) return <AccessDenied />;
  const projects = await getProjects(identity);
  return <EditorShell key={roomId} {...projects} activeProject={activeProject} />;
}
