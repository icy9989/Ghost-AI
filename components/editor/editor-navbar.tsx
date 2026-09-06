"use client";

import { UserButton } from "@clerk/nextjs";
import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  projectName?: string;
  onShare?: () => void;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  projectName,
  onShare,
  isAiSidebarOpen,
  onToggleAiSidebar,
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  const toggleLabel = isSidebarOpen
    ? "Close project sidebar"
    : "Open project sidebar";

  return (
    <header className="relative z-50 grid h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-center border-b border-surface-border bg-surface px-3">
      <div className="flex items-center justify-start">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label={toggleLabel}
          aria-expanded={isSidebarOpen}
          aria-controls="project-sidebar"
          onClick={onToggleSidebar}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="size-5" />
          ) : (
            <PanelLeftOpen className="size-5" />
          )}
        </Button>
      </div>
      <div className="min-w-0 text-center">{projectName && <h1 className="truncate text-sm font-semibold text-copy-primary" title={projectName}>{projectName}</h1>}</div>
      <div className="flex items-center justify-end gap-2">
        {projectName && <>
          <Button type="button" variant="outline" onClick={onShare} aria-label="Share project"><Share2 className="size-4" /><span className="hidden sm:inline">Share</span></Button>
          <Button type="button" variant="ghost" size="icon-lg" aria-label={isAiSidebarOpen ? "Close AI sidebar" : "Open AI sidebar"} aria-expanded={isAiSidebarOpen} aria-controls="ai-sidebar" onClick={onToggleAiSidebar}><Sparkles className="size-5" /></Button>
        </>}

        <UserButton />
      </div>
    </header>
  );
}
