"use client";

import { useRef, useState } from "react";

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  isOwner: boolean;
}

type ProjectDialog =
  | { type: "create" }
  | { type: "rename" | "delete"; project: MockProject }
  | null;

const initialProjects: MockProject[] = [
  { id: "commerce", name: "Commerce Platform", slug: "commerce-platform", isOwner: true },
  { id: "shared", name: "Event Pipeline", slug: "event-pipeline", isOwner: false },
];

export function projectSlug(name: string) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function useProjectDialogs() {
  const [projects, setProjects] = useState(initialProjects);
  const [dialog, setDialog] = useState<ProjectDialog>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const submitting = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const slug = projectSlug(name);
  const canSubmit = dialog?.type === "delete" || Boolean(name.trim() && slug);

  function openDialog(next: NonNullable<ProjectDialog>) {
    if (submitting.current || (next.type !== "create" && !next.project.isOwner)) return;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setName(next.type === "rename" ? next.project.name : "");
    setDialog(next);
  }

  function closeDialog() {
    if (!submitting.current) setDialog(null);
  }

  async function submit() {
    if (!dialog || !canSubmit || submitting.current) return;
    if (dialog.type !== "create" && !dialog.project.isOwner) return;
    submitting.current = true;
    setIsLoading(true);
    try {
      // Yield locally so the form can reflect its pending state; no remote work.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const nextName = name.trim();
      const id = dialog.type === "create" ? crypto.randomUUID() : dialog.project.id;
      setProjects((current) => {
        if (dialog.type === "create") {
          return [...current, { id, name: nextName, slug, isOwner: true }];
        }
        if (dialog.type === "delete") return current.filter((project) => project.id !== id);
        return current.map((project) => project.id === id ? { ...project, name: nextName, slug } : project);
      });
      setDialog(null);
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  }

  return {
    projects, dialog, name, setName, slug, isLoading, canSubmit, submit, closeDialog,
    openCreate: () => openDialog({ type: "create" }),
    openRename: (project: MockProject) => openDialog({ type: "rename", project }),
    openDelete: (project: MockProject) => openDialog({ type: "delete", project }),
    restoreFocus: () => {
      if (trigger.current?.isConnected) trigger.current.focus();
      else document.getElementById("sidebar-new-project")?.focus();
    },
  };
}
