// components/admin/website/ContactEditor.tsx
"use client";

import { useSectionForm } from "@/hooks/useSectionForm";
import { SectionEditorShell } from "@/components/SectionEditorShell";
import { TextField, TextAreaField } from "@/components/TextFields";
import { ImageUploadField } from "@/components/ImageUploadField";
import type { ContactConfig } from "@/types/website";

export function ContactEditor({ initialValue }: { initialValue: ContactConfig }) {
  const { value, update, dirty, save, isSaving, isSuccess, error } = useSectionForm(
    "contact",
    initialValue
  );

  return (
    <SectionEditorShell
      title="Contact"
      dirty={dirty}
      isSaving={isSaving}
      isSuccess={isSuccess}
      error={error}
      onSave={save}
    >
      <ImageUploadField
        label="Background image"
        value={value.backgroundImage}
        onChange={(url) => update({ ...value, backgroundImage: url })}
      />
      <TextField label="Heading" value={value.heading} onChange={(v) => update({ ...value, heading: v })} />
      <TextAreaField
        label="Description"
        value={value.description}
        onChange={(v) => update({ ...value, description: v })}
      />
    </SectionEditorShell>
  );
}