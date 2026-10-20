// components/admin/website/NavbarEditor.tsx
"use client";

import { useSectionForm } from "@/hooks/useSectionForm";
import { SectionEditorShell } from "@/components/SectionEditorShell";
import { ImageUploadField } from "@/components/ImageUploadField";
import type { NavbarConfig } from "@/types/website";

export function NavbarEditor({ initialValue }: { initialValue: NavbarConfig }) {
  const { value, update, dirty, save, isSaving, isSuccess, error } = useSectionForm(
    "navbar",
    initialValue
  );

  return (
    <SectionEditorShell
      title="Navbar"
      dirty={dirty}
      isSaving={isSaving}
      isSuccess={isSuccess}
      error={error}
      onSave={save}
    >
      <ImageUploadField
        label="Logo"
        value={value.logo}
        onChange={(url) => update({ ...value, logo: url })}
      />
    </SectionEditorShell>
  );
}