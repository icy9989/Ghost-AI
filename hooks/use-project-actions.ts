"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectSummary } from "@/lib/project";

type ProjectDialog =
  | { type: "create" }
  | { type: "rename" | "delete"; project: ProjectSummary }
  | null;

export function projectSlug(name: string) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function useProjectActions(activeProjectId?: string) {
  const router = useRouter();
  const [suffix, setSuffix] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ProjectDialog>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const submitting = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const slug = projectSlug(name).slice(0, 187).replace(/-+$/, "");
  const roomId = slug ? `${slug}-${suffix}` : "";
  const canSubmit = dialog?.type === "delete" || Boolean(name.trim() && (dialog?.type === "rename" || slug));

  function openDialog(next: NonNullable<ProjectDialog>) {
    if (submitting.current || (next.type !== "create" && !next.project.isOwner)) return;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setError(null);
    if (next.type === "create") setSuffix(crypto.randomUUID().replaceAll("-", "").slice(0, 12));
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
      setError(null);
      const response = await fetch(dialog.type === "create" ? "/api/projects" : `/api/projects/${encodeURIComponent(dialog.project.id)}`, {
        method: dialog.type === "create" ? "POST" : dialog.type === "rename" ? "PATCH" : "DELETE",
        headers: { "Content-Type": "application/json" },
        ...(dialog.type !== "delete" && { body: JSON.stringify({ name: name.trim(), ...(dialog.type === "create" && { roomId }) }) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to save project. Please try again.");
      if (dialog.type === "create") {
        if (typeof result.project?.id !== "string") throw new Error("The project response was invalid. Please reload.");
        router.push(`/editor/${encodeURIComponent(result.project.id)}`);
      } else if (dialog.type === "delete" && dialog.project.id === activeProjectId) {
        router.replace("/editor");
        router.refresh();
      } else {
        router.refresh();
      }
      setDialog(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save project. Please try again.");
    } finally {
      submitting.current = false;
      setIsLoading(false);
    }
  }

  return {
    dialog, name, setName, roomId, error, isLoading, canSubmit, submit, closeDialog,
    openCreate: () => openDialog({ type: "create" }),
    openRename: (project: ProjectSummary) => openDialog({ type: "rename", project }),
    openDelete: (project: ProjectSummary) => openDialog({ type: "delete", project }),
    restoreFocus: () => {
      if (trigger.current?.isConnected) trigger.current.focus();
      else document.getElementById("sidebar-new-project")?.focus();
    },
  };
}
