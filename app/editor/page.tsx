import { EditorShell } from "@/components/editor/editor-shell";
import { getProjects } from "@/lib/projects";

export default async function EditorPage() {
  const projects = await getProjects();
  return <EditorShell {...projects} />;
}
