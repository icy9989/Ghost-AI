"use client";

import { useEffect, useRef, useState } from "react";
import type { Collaborator } from "@/types/collaborator";

export function useShareDialog(projectId: string) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);
  const endpoint = `/api/projects/${encodeURIComponent(projectId)}/collaborators`;

  useEffect(() => {
    const controller = new AbortController();
    void fetchCollaborators(endpoint, controller.signal).then((data) => {
      if (!controller.signal.aborted) {
        setCollaborators(data.collaborators);
        setIsOwner(data.isOwner);
      }
    }).catch((cause) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load collaborators");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); if (timer.current) clearTimeout(timer.current); };
  }, [endpoint]);

  async function mutate(method: "POST" | "DELETE", address: string) {
    if (!isOwner || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: address }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update collaborators");
      if (method === "POST") setEmail("");
      const refreshed = await fetchCollaborators(endpoint);
      setCollaborators(refreshed.collaborators);
      setIsOwner(refreshed.isOwner);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update collaborators"); }
    finally { pending.current = false; setBusy(false); }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/editor/${encodeURIComponent(projectId)}`);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch { setError("Unable to copy the project link. Please try again."); }
  }

  return { collaborators, isOwner, email, setEmail, error, loading, busy, copied, copyLink, invite: () => mutate("POST", email), remove: (address: string) => mutate("DELETE", address) };
}

async function fetchCollaborators(endpoint: string, signal?: AbortSignal): Promise<{ collaborators: Collaborator[]; isOwner: boolean }> {
  const response = await fetch(endpoint, { cache: "no-store", signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load collaborators");
  return data;
}
