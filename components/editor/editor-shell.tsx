"use client";

import type { CanvasSaveStatus } from "@/lib/canvas-snapshot";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AiSidebar } from "@/components/editor/ai-sidebar";
import { CanvasRoom } from "@/components/editor/canvas-room";
import { ShareDialog } from "@/components/editor/share-dialog";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { useProjectActions } from "@/hooks/use-project-actions";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

import type { ProjectSummary } from "@/lib/project";

interface EditorShellProps {
  ownedProjects: ProjectSummary[];
  sharedProjects: ProjectSummary[];
  activeProject?: ProjectSummary;
}

export function EditorShell({ ownedProjects, sharedProjects, activeProject }: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(Boolean(activeProject));
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<CanvasSaveStatus>("saving");
  const [saveRequest, setSaveRequest] = useState(0);
  const projectDialogs = useProjectActions(activeProject?.id);

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-base">
      <EditorNavbar
        isWorkspace={Boolean(activeProject)}
        saveStatus={saveStatus}
        onSave={() => setSaveRequest(value => value + 1)}
        projectName={activeProject?.name}
        onShare={() => setIsShareOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => { setIsAiSidebarOpen((open) => !open); setIsSidebarOpen(false); }}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => { setIsSidebarOpen((isOpen) => !isOpen); setIsAiSidebarOpen(false); }}
      />
      <div className={activeProject ? "relative min-h-0 flex-1" : "relative flex min-h-0 flex-1 items-center justify-center px-6 py-16"} aria-label="Editor canvas">
        {activeProject ? <CanvasRoom onSaveStatus={setSaveStatus} saveRequest={saveRequest} roomId={activeProject.id} templatesOpen={isTemplatesOpen} onTemplatesOpenChange={setIsTemplatesOpen} /> : <div className="max-w-xl text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-copy-primary sm:text-3xl">Create a project or open an existing one</h1>
          <p className="mt-3 text-sm leading-6 text-copy-muted">Start a new architecture workspace, or choose a project from the sidebar.</p>
          <Button type="button" className="mt-6" onClick={projectDialogs.openCreate}>
            <Plus data-icon="inline-start" />
            New Project
          </Button>
        </div>}
      </div>
      {isSidebarOpen && (
        <button type="button" aria-label="Dismiss project sidebar" className="fixed inset-x-0 top-14 bottom-0 z-30 bg-base/70 backdrop-blur-xs md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <ProjectSidebar
        currentRoomId={activeProject?.id}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onCreate={projectDialogs.openCreate}
        onRename={projectDialogs.openRename}
        onDelete={projectDialogs.openDelete}
      />
      {activeProject && <AiSidebar key={activeProject.id} isOpen={isAiSidebarOpen} onClose={() => setIsAiSidebarOpen(false)} />}
      <ProjectDialogs controller={projectDialogs} />
      {activeProject && isShareOpen && <ShareDialog projectId={activeProject.id} projectName={activeProject.name} onClose={() => setIsShareOpen(false)} />}
    </main>
  );
}
