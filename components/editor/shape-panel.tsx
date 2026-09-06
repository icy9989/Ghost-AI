"use client";

import { Circle, Cylinder, Diamond, Hexagon, Pill, RectangleHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SHAPE_DRAG_TYPE, SHAPE_SIZES } from "@/lib/canvas-shapes";
import { NODE_SHAPES } from "@/types/canvas";

const shapeIcons = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Cylinder,
  hexagon: Hexagon,
};

export function ShapePanel() {
  return (
    <div
      role="group"
      aria-label="Drag shapes onto the canvas"
      className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1 rounded-full border border-surface-border bg-surface p-2 shadow-lg"
      onDrop={(event) => event.stopPropagation()}
    >
      {NODE_SHAPES.map((shape) => {
        const Icon = shapeIcons[shape];
        return (
          <Button
            key={shape}
            type="button"
            variant="ghost"
            size="icon-lg"
            draggable
            aria-label={`Drag ${shape} onto canvas`}
            title={`Drag ${shape} onto canvas`}
            className="cursor-grab rounded-full text-copy-secondary active:cursor-grabbing"
            onDragStart={(event) => {
              event.dataTransfer.setData(SHAPE_DRAG_TYPE, JSON.stringify({ shape, ...SHAPE_SIZES[shape] }));
              event.dataTransfer.effectAllowed = "copy";
            }}
          >
            <Icon className="size-5" aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}
