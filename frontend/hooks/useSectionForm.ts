// hooks/useSectionForm.ts
"use client";

import { useCallback, useState } from "react";
import { useUpdateWebsiteSection } from "@/hooks/useWebsiteAdmin";
import type { SectionKey } from "@/types/website";

// Generic per-section form: holds local edits, tracks whether they differ
// from the last save, and exposes a save() that PATCHes just this section.
//
// T is intentionally unconstrained (not `T extends Record<string, unknown>`)
// because our section types are plain `interface`s, which TS does not treat
// as assignable to Record<string, unknown> — they have no index signature
// even though they match its shape at runtime. The cast to the API's wider
// param type happens internally instead, via `unknown`.
export function useSectionForm<T>(section: SectionKey, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [dirty, setDirty] = useState(false);
  const { mutate, isPending, isSuccess, error } = useUpdateWebsiteSection();

  const update = useCallback((next: T) => {
    setValue(next);
    setDirty(true);
  }, []);

  const save = useCallback(() => {
    mutate(
      { section, value: value as unknown as Record<string, unknown> | unknown[] },
      { onSuccess: () => setDirty(false) }
    );
  }, [mutate, section, value]);

  return { value, update, dirty, save, isSaving: isPending, isSuccess, error };
}