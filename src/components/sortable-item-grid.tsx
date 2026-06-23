"use client";

import { useEffect, useState } from "react";
import type { Collection, SavedItem } from "@prisma/client";
import { Check } from "lucide-react";
import { BulkItemActions } from "@/components/bulk-item-actions";
import { ItemCard } from "@/components/item-card";

type ItemWithCollection = SavedItem & { collection: Collection | null };

export function SortableItemGrid({
  items: initialItems,
  collections,
}: {
  items: ItemWithCollection[];
  collections: { id: string; name: string }[];
}) {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selecting = selectedIds.size > 0;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  function moveItem(targetId: string) {
    if (!draggedId || draggedId === targetId) return;

    setItems((current) => {
      const from = current.findIndex((item) => item.id === draggedId);
      const to = current.findIndex((item) => item.id === targetId);
      if (from < 0 || to < 0) return current;

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function saveOrder() {
    if (!draggedId) return;
    setDraggedId(null);

    try {
      const response = await fetch("/api/saved-items/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: items.map((item) => item.id) }),
      });

      if (!response.ok) {
        setItems(initialItems);
      }
    } catch {
      setItems(initialItems);
    }
  }

  function toggleSelection(itemId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  return (
    <div className="relative mt-3">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            draggable={!selecting}
            onDragStart={(event) => {
              if (selecting) return;
              setDraggedId(item.id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", item.id);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              moveItem(item.id);
            }}
            onDragEnd={saveOrder}
            className={`relative ${
              draggedId === item.id
                ? "cursor-grabbing opacity-50"
                : selecting
                  ? ""
                  : "cursor-grab"
            } ${
              selectedIds.has(item.id)
                ? "rounded-[1.7rem] ring-4 ring-[var(--action)]/25"
                : ""
            }`}
          >
            {selecting ? (
              <button
                type="button"
                className="absolute inset-0 z-10 rounded-2xl"
                onClick={() => toggleSelection(item.id)}
                aria-label="投稿の選択を切り替える"
              />
            ) : null}
            <button
              type="button"
              onClick={() => toggleSelection(item.id)}
              className={`absolute top-3 left-3 z-20 grid size-8 place-items-center rounded-lg border shadow-sm backdrop-blur transition ${
                selectedIds.has(item.id)
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-white/80 bg-white/90 text-stone-400 hover:text-[var(--primary)]"
              }`}
              aria-label={
                selectedIds.has(item.id) ? "選択を解除" : "投稿を選択"
              }
            >
              <Check size={17} />
            </button>
            <ItemCard item={item} variant="dewey" />
          </div>
        ))}
      </div>
      <BulkItemActions
        selectedItems={items.filter((item) => selectedIds.has(item.id))}
        collections={collections}
        onComplete={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
