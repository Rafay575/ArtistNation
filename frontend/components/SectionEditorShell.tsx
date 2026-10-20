// components/admin/website/SectionEditorShell.tsx
"use client";

import type { ReactNode } from "react";

export function SectionEditorShell({
  title,
  dirty,
  isSaving,
  isSuccess,
  error,
  onSave,
  children,
}: {
  title: string;
  dirty: boolean;
  isSaving: boolean;
  isSuccess: boolean;
  error: unknown;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-3">
          {isSuccess && !dirty && <span className="text-xs text-green-600">Saved</span>}
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || isSaving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {Boolean(error) && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Couldn't save this section. Please try again.
        </p>
      )}

      <div className="space-y-6">{children}</div>
    </div>
  );
}