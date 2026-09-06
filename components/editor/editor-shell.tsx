"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectDialogs } from "@/components/editor/project-dialogs";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";

export function EditorShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const projectDialogs = useProjectDialogs();

  return (
    <main className="flex min-h-dvh flex-col overflow-hidden bg-base">
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />
      <div className="relative flex flex-1 items-center justify-center px-6 py-16" aria-label="Editor canvas">
        <div className="max-w-xl text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-copy-primary sm:text-3xl">Create a project or open an existing one</h1>
          <p className="mt-3 text-sm leading-6 text-copy-muted">Start a new architecture workspace, or choose a project from the sidebar.</p>
          <Button type="button" className="mt-6" onClick={projectDialogs.openCreate}>
            <Plus data-icon="inline-start" />
            New Project
          </Button>
        </div>
      </div>
      {isSidebarOpen && (
        <button type="button" aria-label="Dismiss project sidebar" className="fixed inset-x-0 top-14 bottom-0 z-30 bg-base/70 backdrop-blur-xs md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projectDialogs.projects}
        onCreate={projectDialogs.openCreate}
        onRename={projectDialogs.openRename}
        onDelete={projectDialogs.openDelete}
      />
      <ProjectDialogs controller={projectDialogs} />
    </main>
  );
}
