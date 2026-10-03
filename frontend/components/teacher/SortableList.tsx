"use client";

import type { DragEvent, ReactNode } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { moveItem, useDragReorder } from "./useDragReorder";

type RowControls = {
  /** Drag + keyboard-accessible move controls to render inside the row. */
  handle: ReactNode;
  isDragging: boolean;
  isOver: boolean;
};

type Props<T extends { id: string }> = {
  items: T[];
  onReorder: (orderedIds: string[]) => void;
  renderItem: (item: T, index: number, controls: RowControls) => ReactNode;
  disabled?: boolean;
  label: string;
  className?: string;
};

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  disabled,
  label,
  className,
}: Props<T>) {
  const ids = items.map((item) => item.id);
  const { draggingId, overId, getItemProps } = useDragReorder(ids, onReorder);

  return (
    <div className={className}>
      {items.map((item, index) => {
        const rowProps = disabled
          ? {}
          : (getItemProps(item.id) as {
              draggable: boolean;
              onDragStart: (event: DragEvent) => void;
              onDragOver: (event: DragEvent) => void;
              onDrop: (event: DragEvent) => void;
              onDragEnd: () => void;
            });
        const handle = (
          <span className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
            <GripVertical
              aria-hidden
              className="h-4 w-4 cursor-grab active:cursor-grabbing"
            />
            <button
              type="button"
              aria-label={`${label}: ↑`}
              disabled={disabled || index === 0}
              onClick={() => onReorder(moveItem(ids, index, index - 1))}
              className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label={`${label}: ↓`}
              disabled={disabled || index === items.length - 1}
              onClick={() => onReorder(moveItem(ids, index, index + 1))}
              className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </span>
        );
        const isDragging = draggingId === item.id;
        const isOver = overId === item.id && draggingId !== item.id;
        return (
          <div
            key={item.id}
            {...rowProps}
            className={`${isDragging ? "opacity-40" : ""} ${isOver ? "rounded-xl ring-2 ring-blue-500/60" : ""}`}
          >
            {renderItem(item, index, { handle, isDragging, isOver })}
          </div>
        );
      })}
    </div>
  );
}
