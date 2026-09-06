"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { useProjectActions } from "@/hooks/use-project-actions";

interface ProjectDialogsProps {
  controller: ReturnType<typeof useProjectActions>;
}

export function ProjectDialogs({ controller }: ProjectDialogsProps) {
  const input = useRef<HTMLInputElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const { dialog, name, setName, roomId, error, isLoading, canSubmit, submit, closeDialog, restoreFocus } = controller;
  const isDelete = dialog?.type === "delete";
  const isRename = dialog?.type === "rename";
  const title = isDelete ? "Delete Project" : isRename ? "Rename Project" : "Create Project";

  return (
    <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
      <DialogContent
        className="rounded-3xl"
        showCloseButton={!isLoading}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (isDelete) cancel.current?.focus();
          else { input.current?.focus(); input.current?.select(); }
        }}
        onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus(); }}
      >
        <form className="grid gap-5" aria-busy={isLoading} onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <DialogHeader className="pr-6">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="break-words">
              {isDelete ? `Delete “${dialog.project.name}”? This action cannot be undone.`
                : isRename ? `Choose a new name for “${dialog.project.name}”.`
                : "Give your architecture workspace a name."}
            </DialogDescription>
          </DialogHeader>
          {!isDelete && (
            <div className="grid gap-2">
              <label htmlFor="project-name" className="text-sm font-medium">Project name</label>
              <Input ref={input} id="project-name" value={name} onChange={(event) => setName(event.target.value)} disabled={isLoading} required autoComplete="off" aria-describedby={!isRename ? "project-slug" : undefined} />
              {!isRename && <p id="project-slug" className="break-all text-xs text-copy-muted" aria-live="polite">Room ID: <span className="font-mono">{roomId || "your-project-name"}</span></p>}
            </div>
          )}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="rounded-b-3xl">
            <Button ref={cancel} type="button" variant="outline" disabled={isLoading} onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant={isDelete ? "destructive" : "default"} disabled={!canSubmit || isLoading}>
              {isLoading ? "Saving…" : title}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
