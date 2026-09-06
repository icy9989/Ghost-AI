import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export function AccessDenied() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-base px-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <LockKeyhole className="size-8 text-copy-muted" aria-hidden="true" />
        <h1 className="text-2xl font-semibold text-copy-primary">Access denied</h1>
        <p className="text-sm text-copy-muted">This project is unavailable or you don’t have access to it.</p>
        <Link href="/editor" className="rounded-xl text-sm font-medium text-brand underline underline-offset-4">Back to projects</Link>
      </div>
    </main>
  );
}
