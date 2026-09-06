import { BrainCircuit, FileText, Share2 } from "lucide-react";
import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
}

const features = [
  {
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
    icon: BrainCircuit,
  },
  {
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
    icon: Share2,
  },
  {
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
    icon: FileText,
  },
];

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-dvh bg-base lg:grid-cols-2">
      <section className="hidden border-r border-surface-border bg-surface px-10 py-8 lg:flex lg:flex-col xl:px-16 xl:py-10 2xl:px-20">
        <div className="flex items-center gap-3 text-lg font-semibold tracking-tight text-copy-primary">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand text-base font-bold text-primary-foreground">
            G
          </span>
          Ghost AI
        </div>

        <div className="my-auto max-w-2xl py-16">
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.15] tracking-tight text-copy-primary xl:text-5xl 2xl:text-6xl">
            Design systems at the speed of thought.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-copy-secondary xl:text-xl">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>

          <ul className="mt-16 space-y-8">
            {features.map((feature) => (
              <li key={feature.title} className="flex items-start gap-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-dim text-brand">
                  <feature.icon className="size-6" aria-hidden="true" />
                </span>
                <div className="pt-0.5">
                  <h2 className="font-semibold text-copy-primary">
                    {feature.title}
                  </h2>
                  <p className="mt-1 leading-6 text-copy-muted">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex min-h-dvh items-center justify-center bg-base px-4 py-8 sm:px-8 lg:px-12">
        {children}
      </section>
    </main>
  );
}
