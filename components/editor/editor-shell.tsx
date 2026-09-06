"use client";

import { useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  const [isShareOpen, setIsShareOpen] = useState(false);
  const projectDialogs = useProjectActions(activeProject?.id);

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-base">
      <EditorNavbar
        projectName={activeProject?.name}
        onShare={() => setIsShareOpen(true)}
        isAiSidebarOpen={isAiSidebarOpen}
        onToggleAiSidebar={() => { setIsAiSidebarOpen((open) => !open); setIsSidebarOpen(false); }}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => { setIsSidebarOpen((isOpen) => !isOpen); setIsAiSidebarOpen(false); }}
      />
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-6 py-16" aria-label="Editor canvas">
        {activeProject ? <p className="text-center text-sm text-copy-muted">Your architecture canvas will appear here.</p> : <div className="max-w-xl text-center">
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
      {activeProject && isAiSidebarOpen && (
        <>
          <button type="button" aria-label="Dismiss AI sidebar" className="fixed inset-x-0 top-14 bottom-0 z-30 bg-base/70 backdrop-blur-xs md:hidden" onClick={() => setIsAiSidebarOpen(false)} />
          <aside id="ai-sidebar" aria-label="AI assistant" className="fixed top-[4.25rem] right-3 bottom-3 z-40 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border px-4">
              <h2 className="font-semibold text-copy-primary">AI Assistant</h2>
              <Button type="button" variant="ghost" size="icon" aria-label="Close AI sidebar" onClick={() => setIsAiSidebarOpen(false)}><X className="size-5" /></Button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-copy-muted">
              <Sparkles className="size-8" aria-hidden="true" />
              <p className="text-sm">AI chat is coming soon.</p>
            </div>
          </aside>
        </>
      )}
      <ProjectDialogs controller={projectDialogs} />
      {activeProject && isShareOpen && <ShareDialog projectId={activeProject.id} projectName={activeProject.name} onClose={() => setIsShareOpen(false)} />}
    </main>
  );
}
