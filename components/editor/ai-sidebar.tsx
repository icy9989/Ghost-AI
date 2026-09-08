"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Download, FileText, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "72px";
    textarea.style.height = `${Math.min(160, Math.max(72, textarea.scrollHeight))}px`;
  }, [draft, isOpen]);

  useEffect(() => {
    const chat = chatRef.current;
    if (chat) chat.scrollTop = chat.scrollHeight;
  }, [messages]);

  function submitMessage() {
    const content = draft.trim();
    if (!content) return;
    setMessages((current) => [...current, { role: "user", content }]);
    setDraft("");
    textareaRef.current?.focus();
  }

  return (
    <>
      {isOpen && <button type="button" aria-label="Dismiss AI sidebar" className="fixed inset-x-0 top-14 bottom-0 z-30 bg-base/70 backdrop-blur-xs md:hidden" onClick={onClose} />}
      <aside
        id="ai-sidebar"
        aria-label="AI assistant"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "fixed top-[4.25rem] right-3 bottom-3 z-40 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-surface-border bg-base/95 shadow-2xl backdrop-blur transition-transform duration-300 ease-in-out motion-reduce:transition-none",
          isOpen ? "translate-x-0" : "pointer-events-none translate-x-[calc(100%+1rem)]",
        )}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-surface-border p-4">
          <Bot className="size-5 text-ai-text" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-copy-primary">AI Workspace</h2>
            <p className="mt-0.5 text-xs text-copy-muted">Collaborate with Ghost AI</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close AI sidebar" onClick={onClose}><X className="size-5" /></Button>
        </header>
        <Tabs defaultValue="architect" className="min-h-0 flex-1 gap-0">
          <TabsList className="m-4 grid w-auto shrink-0 grid-cols-2" aria-label="AI workspace tabs">
            {[["architect", "AI Architect"], ["specs", "Specs"]].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="text-copy-muted data-[state=active]:bg-ai/15 data-[state=active]:text-ai-text dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-ai/15 dark:data-[state=active]:text-ai-text">{label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="architect" forceMount className="flex min-h-0 flex-col data-[state=inactive]:hidden">
            <div ref={chatRef} role="log" aria-label="Architecture chat" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              {messages.length === 0 ? (
                <div className="flex min-h-full flex-col items-center justify-center gap-4 py-6 text-center">
                  <div className="rounded-2xl bg-ai/10 p-3 text-ai-text"><Bot className="size-8" aria-hidden="true" /></div>
                  <div>
                    <h3 className="font-medium text-copy-primary">Design your next system</h3>
                    <p className="mt-2 text-sm leading-6 text-copy-muted">Describe what you want to build, or start with an idea below.</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {STARTER_PROMPTS.map((prompt) => <Button key={prompt} type="button" variant="ghost" className="h-auto whitespace-normal rounded-full bg-subtle px-3 py-2 text-xs text-ai-text hover:bg-ai/15 hover:text-ai-text" onClick={() => { setDraft(prompt); textareaRef.current?.focus(); }}>{prompt}</Button>)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((message, index) => <p key={index} className={cn("max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap wrap-anywhere", message.role === "user" ? "self-end border-2 border-brand/50 bg-accent-dim text-copy-primary" : "self-start border border-surface-border bg-elevated text-ai-text")}><span className="sr-only">{message.role === "user" ? "You" : "Ghost AI"}: </span>{message.content}</p>)}
                </div>
              )}
            </div>
            <form className="shrink-0 border-t border-surface-border p-4" onSubmit={(event) => { event.preventDefault(); submitMessage(); }}>
              <Textarea ref={textareaRef} aria-label="Message AI Architect" placeholder="Describe your system…" value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-[72px] max-h-40 resize-none overflow-y-auto field-sizing-fixed bg-elevated" onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  submitMessage();
                }
              }} />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-copy-muted">Shift+Enter for a new line</p>
                <Button type="submit" size="icon" aria-label="Send message" disabled={!draft.trim()} className="bg-ai text-white hover:bg-ai/90"><Send className="size-4" /></Button>
              </div>
              <p className="mt-2 text-xs text-copy-muted">AI responses are coming soon.</p>
            </form>
          </TabsContent>
          <TabsContent value="specs" className="min-h-0 overflow-y-auto px-4 pb-4">
            <Button type="button" disabled className="w-full bg-ai text-white hover:bg-ai/90"><Sparkles className="size-4" />Generate Spec</Button>
            <p className="mt-2 text-xs text-copy-muted">Spec generation is coming soon.</p>
            <article className="mt-4 rounded-2xl border border-surface-border bg-elevated p-4">
              <div className="flex items-center gap-2 text-ai-text"><FileText className="size-5" aria-hidden="true" /><span className="text-xs">Demo spec</span></div>
              <h3 className="mt-3 font-medium text-copy-primary">System Architecture Specification</h3>
              <p className="mt-2 text-sm leading-6 text-copy-muted">An overview of services, data storage, and communication patterns for an e-commerce backend.</p>
              <Button type="button" variant="outline" disabled className="mt-4" aria-label="Download demo specification"><Download className="size-4" />Download</Button>
            </article>
          </TabsContent>
        </Tabs>
      </aside>
    </>
  );
}
