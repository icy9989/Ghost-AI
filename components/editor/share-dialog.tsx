"use client";

import Image from "next/image";
import { Copy, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useShareDialog } from "@/hooks/use-share-dialog";

interface ShareDialogProps {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export function ShareDialog({ projectId, projectName, onClose }: ShareDialogProps) {
  const share = useShareDialog(projectId);
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !share.busy) onClose(); }}>
      <DialogContent className="rounded-3xl" showCloseButton={!share.busy}>
        <DialogHeader className="min-w-0 pr-6">
          <DialogTitle className="break-words">Share {projectName}</DialogTitle>
          <DialogDescription>{share.loading ? "Loading project access…" : share.isOwner ? "Invite collaborators by email to access this project." : "You can view collaborators. Only the owner can manage access."}</DialogDescription>
        </DialogHeader>
        {share.isOwner && (
          <form className="grid gap-2" onSubmit={(event) => { event.preventDefault(); void share.invite(); }}>
            <label htmlFor="collaborator-email" className="text-sm font-medium">Email address</label>
            <div className="flex gap-2">
              <Input id="collaborator-email" className="min-w-0" type="email" autoComplete="email" placeholder="name@example.com" maxLength={254} required value={share.email} disabled={share.busy} onChange={(event) => share.setEmail(event.target.value)} />
              <Button type="submit" disabled={share.busy || !share.email.trim()}>Invite</Button>
            </div>
          </form>
        )}
        <section aria-label="Collaborators" aria-busy={share.loading || share.busy} className="grid gap-3">
          <h3 className="text-sm font-medium">Collaborators</h3>
          {share.loading ? <p role="status" className="text-sm text-copy-muted">Loading collaborators…</p> : !share.collaborators.length ? <p className="text-sm text-copy-muted">No collaborators yet.</p> : (
            <ul className="max-h-[40dvh] space-y-3 overflow-y-auto">
              {share.collaborators.map((person) => (
                <li key={person.email} className="flex items-center gap-3">
                  {person.imageUrl ? <Image unoptimized src={person.imageUrl} alt="" width={32} height={32} className="size-8 shrink-0 rounded-full" /> : <UserRound aria-hidden="true" className="size-8 shrink-0 rounded-full bg-muted p-1.5 text-copy-muted" />}
                  <div className="min-w-0 flex-1 text-sm">
                    {person.displayName && <p className="break-words font-medium">{person.displayName}</p>}
                    <p className="break-all text-copy-muted">{person.email}</p>
                  </div>
                  {share.isOwner && <Button type="button" size="sm" variant="ghost" className="shrink-0 text-destructive" disabled={share.busy} aria-label={`Remove ${person.email}`} onClick={() => void share.remove(person.email)}>Remove</Button>}
                </li>
              ))}
            </ul>
          )}
        </section>
        {share.error && <p role="alert" className="text-sm text-destructive">{share.error}</p>}
        {share.isOwner && <DialogFooter className="rounded-b-3xl"><Button type="button" variant="outline" onClick={() => void share.copyLink()}><Copy className="size-4" /><span aria-live="polite">{share.copied ? "Copied!" : "Copy project link"}</span></Button></DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
