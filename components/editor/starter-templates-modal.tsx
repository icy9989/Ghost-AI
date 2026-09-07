"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "@/components/editor/starter-templates";
import { SHAPE_SIZES } from "@/lib/canvas-shapes";
import { NODE_COLORS, type CanvasNode } from "@/types/canvas";

export interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

// Keep previews entirely in SVG so all shapes share the same transform and clipping.
function PreviewNode({ node, width, height }: { node: CanvasNode; width: number; height: number }) {
  const { shape, color, textColor, label } = node.data;
  return (
    <g transform={`translate(${node.position.x}, ${node.position.y})`}>
      <svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none" fill={color} stroke="var(--border-subtle)" strokeWidth={1}>
        {shape === "rectangle" && <rect x="1" y="1" width="98" height="98" rx="8" vectorEffect="non-scaling-stroke" />}
        {shape === "pill" && <rect x="1" y="1" width="98" height="98" rx="49" vectorEffect="non-scaling-stroke" />}
        {shape === "circle" && <ellipse cx="50" cy="50" rx="49" ry="49" vectorEffect="non-scaling-stroke" />}
        {shape === "diamond" && <polygon points="50,1 99,50 50,99 1,50" vectorEffect="non-scaling-stroke" />}
        {shape === "hexagon" && <polygon points="25,1 75,1 99,50 75,99 25,99 1,50" vectorEffect="non-scaling-stroke" />}
        {shape === "cylinder" && <>
          <path d="M 1 13 A 49 12 0 0 1 99 13 L 99 87 A 49 12 0 0 1 1 87 Z" vectorEffect="non-scaling-stroke" />
          <ellipse cx="50" cy="13" rx="49" ry="12" vectorEffect="non-scaling-stroke" />
        </>}
      </svg>
      <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="central" fill={textColor ?? NODE_COLORS[0].textColor} fontSize={14}>{label}</text>
    </g>
  );
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const nodes = template.nodes.map((node) => ({
    ...node,
    width: node.width ?? SHAPE_SIZES[node.data.shape].width,
    height: node.height ?? SHAPE_SIZES[node.data.shape].height,
  }));
  const left = Math.min(...nodes.map((node) => node.position.x));
  const top = Math.min(...nodes.map((node) => node.position.y));
  const width = Math.max(...nodes.map((node) => node.position.x + node.width)) - left;
  const height = Math.max(...nodes.map((node) => node.position.y + node.height)) - top;
  const scale = Math.min(288 / width, 148 / height);
  const byId = new Map(nodes.map((node) => [node.id, node]));

  return (
    <svg viewBox="0 0 320 180" className="h-44 w-full shrink-0 overflow-hidden rounded-xl bg-base" role="img" aria-label={`${template.name} diagram preview`}>
      <g transform={`translate(${(320 - width * scale) / 2}, ${(180 - height * scale) / 2}) scale(${scale}) translate(${-left}, ${-top})`}>
        {template.edges.map((edge) => {
          const source = byId.get(edge.source);
          const target = byId.get(edge.target);
          if (!source || !target) return null;
          return <line key={edge.id} x1={source.position.x + source.width / 2} y1={source.position.y + source.height / 2} x2={target.position.x + target.width / 2} y2={target.position.y + target.height / 2} stroke="var(--canvas-edge)" strokeWidth={1} strokeOpacity={0.6} vectorEffect="non-scaling-stroke" />;
        })}
        {nodes.map((node) => (
          <PreviewNode key={node.id} node={node} width={node.width} height={node.height} />
        ))}
      </g>
    </svg>
  );
}

export function StarterTemplatesModal({ open, onOpenChange, onImport }: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col rounded-3xl border border-surface-border bg-surface p-6 sm:max-w-4xl">
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle className="text-copy-primary">Starter templates</DialogTitle>
          <DialogDescription>Choose a diagram to get started. Importing replaces all nodes and edges on this canvas.</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 gap-4 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {CANVAS_TEMPLATES.map((template) => (
            <article key={template.id} className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-elevated p-4">
              <TemplatePreview template={template} />
              <h3 className="font-semibold text-copy-primary">{template.name}</h3>
              <p className="flex-1 text-sm leading-6 text-copy-muted">{template.description}</p>
              <Button type="button" aria-label={`Import ${template.name}`} onClick={() => { onImport(template); onOpenChange(false); }}>Import template</Button>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
