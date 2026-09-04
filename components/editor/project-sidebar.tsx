"use client";

import { FolderOpen, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
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
        <TabsContent value="mine" className="min-h-0">
          <EmptyProjects message="You don't have any projects yet." />
        </TabsContent>
        <TabsContent value="shared" className="min-h-0">
          <EmptyProjects message="No projects have been shared with you." />
        </TabsContent>
      </Tabs>

      <div className="shrink-0 border-t border-surface-border p-3">
        <Button type="button" className="w-full">
          <Plus data-icon="inline-start" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
