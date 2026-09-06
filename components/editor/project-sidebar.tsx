"use client";

import { FolderOpen, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MockProject } from "@/hooks/use-project-dialogs";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: MockProject[];
  onCreate: () => void;
  onRename: (project: MockProject) => void;
  onDelete: (project: MockProject) => void;
}

function EmptyProjects({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-subtle text-copy-muted">
        <FolderOpen className="size-8" />
      </div>
      <p className="text-sm text-copy-muted">{message}</p>
    </div>
  );
}

export function ProjectSidebar({ isOpen, onClose, projects, onCreate, onRename, onDelete }: ProjectSidebarProps) {
  function projectList(isOwner: boolean) {
    const items = projects.filter((project) => project.isOwner === isOwner);
    if (!items.length) return <EmptyProjects message={isOwner ? "You don't have any projects yet." : "No projects have been shared with you."} />;
    return (
      <ul className="space-y-1 p-3">
        {items.map((project) => (
          <li key={project.id} className="flex items-center gap-2 rounded-xl bg-subtle/50 px-3 py-2">
            <FolderOpen className="size-4 shrink-0 text-copy-muted" />
            <span className="min-w-0 flex-1 truncate text-sm text-copy-primary" title={project.name}>{project.name}</span>
            {project.isOwner && (
              <div className="flex shrink-0">
                <Button type="button" variant="ghost" size="icon" aria-label={`Rename ${project.name}`} onClick={() => onRename(project)}><Pencil className="size-4" /></Button>
                <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label={`Delete ${project.name}`} onClick={() => onDelete(project)}><Trash2 className="size-4" /></Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <aside
      id="project-sidebar"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "fixed top-[4.25rem] bottom-3 left-3 z-40 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/95 shadow-2xl backdrop-blur transition-transform duration-200 ease-out",
        isOpen
          ? "translate-x-0"
          : "pointer-events-none -translate-x-[calc(100%+0.75rem)]"
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border px-4">
        <h2 className="font-semibold tracking-tight text-copy-primary">
          Projects
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close project sidebar"
          onClick={onClose}
        >
          <X className="size-5" />
        </Button>
      </div>

      <Tabs defaultValue="mine" className="min-h-0 flex-1 gap-0">
        <TabsList
          variant="line"
          aria-label="Project lists"
          className="h-11 w-full shrink-0 border-b border-surface-border px-3"
        >
          <TabsTrigger value="mine">My Projects</TabsTrigger>
          <TabsTrigger value="shared">Shared</TabsTrigger>
        </TabsList>
        <TabsContent value="mine" className="min-h-0 overflow-y-auto">
          {projectList(true)}
        </TabsContent>
        <TabsContent value="shared" className="min-h-0 overflow-y-auto">
          {projectList(false)}
        </TabsContent>
      </Tabs>

      <div className="shrink-0 border-t border-surface-border p-3">
        <Button id="sidebar-new-project" type="button" className="w-full" onClick={onCreate}>
          <Plus data-icon="inline-start" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
