// components/admin/website/RepeatingFieldArray.tsx
"use client";

import type { ReactNode } from "react";

// Generic repeating-row editor: works for arrays of objects (hero slides,
// pricing plans, links...) and arrays of plain strings (a plan's feature
// list) since T is unconstrained.
export function RepeatingFieldArray<T>({
  label,
  items,
  onChange,
  makeNewItem,
  renderItem,
  itemLabel = (index: number) => `Item ${index + 1}`,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  makeNewItem: () => T;
  renderItem: (item: T, index: number, updateItem: (next: T) => void) => ReactNode;
  itemLabel?: (index: number) => string;
}) {
  function updateAt(index: number, next: T) {
    const copy = items.slice();
    copy[index] = next;
    onChange(copy);
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function moveAt(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const copy = items.slice();
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <button
          type="button"
          onClick={() => onChange([...items, makeNewItem()])}
          className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
        >
          + Add
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {itemLabel(index)}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveAt(index, -1)}
                  className="rounded border border-gray-300 px-2 py-0.5 text-xs disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => moveAt(index, 1)}
                  className="rounded border border-gray-300 px-2 py-0.5 text-xs disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {renderItem(item, index, (next) => updateAt(index, next))}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-sm text-gray-400">Nothing here yet — click "+ Add" to create one.</p>
        )}
      </div>
    </div>
  );
}