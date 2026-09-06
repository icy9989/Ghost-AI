import { notFound } from "next/navigation";
import { EditorShell } from "@/components/editor/editor-shell";
import { getProjects } from "@/lib/projects";

export default async function WorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const projects = await getProjects();
  const activeProject = [...projects.ownedProjects, ...projects.sharedProjects].find((project) => project.id === projectId);
  if (!activeProject) notFound();
  return <EditorShell {...projects} activeProject={activeProject} />;
}
