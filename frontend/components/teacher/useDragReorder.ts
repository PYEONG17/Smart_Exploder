import { useState, type DragEvent } from "react";

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

// Native HTML5 drag-and-drop for a flat list; ids identify rows.
export function useDragReorder(
  ids: string[],
  onReorder: (orderedIds: string[]) => void,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const reset = () => {
    setDraggingId(null);
    setOverId(null);
  };

  const getItemProps = (id: string) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      event.stopPropagation();
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
      setDraggingId(id);
    },
    onDragOver: (event: DragEvent) => {
      if (!draggingId) return;
      event.preventDefault();
      event.stopPropagation();
      setOverId(id);
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (draggingId && draggingId !== id) {
        onReorder(moveItem(ids, ids.indexOf(draggingId), ids.indexOf(id)));
      }
      reset();
    },
    onDragEnd: reset,
  });

  return { draggingId, overId, getItemProps };
}
