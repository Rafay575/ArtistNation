// components/admin/website/ServicesEditor.tsx
"use client";

import { useSectionForm } from "@/hooks/useSectionForm";
import { SectionEditorShell } from "@/components/SectionEditorShell";
import { RepeatingFieldArray } from "@/components/RepeatingFieldArray";
import { TextField, TextAreaField } from "@/components/TextFields";
import { ImageUploadField } from "@/components/ImageUploadField";
import type { ServicesConfig, IconFeature } from "@/types/website";

export function ServicesEditor({ initialValue }: { initialValue: ServicesConfig }) {
  const { value, update, dirty, save, isSaving, isSuccess, error } = useSectionForm(
    "services",
    initialValue
  );

  return (
    <SectionEditorShell
      title="Services"
      dirty={dirty}
      isSaving={isSaving}
      isSuccess={isSuccess}
      error={error}
      onSave={save}
    >
      <TextField label="Title" value={value.title} onChange={(v) => update({ ...value, title: v })} />
      <TextAreaField
        label="Description"
        value={value.description}
        onChange={(v) => update({ ...value, description: v })}
      />
      <ImageUploadField
        label="Background image"
        value={value.backgroundImage}
        onChange={(url) => update({ ...value, backgroundImage: url })}
      />

      <RepeatingFieldArray<IconFeature>
        label="Feature points"
        items={value.features}
        onChange={(items) => update({ ...value, features: items })}
        itemLabel={(i) => `Point ${i + 1}`}
        makeNewItem={() => ({ title: "", description: "", icon: "" })}
        renderItem={(item, _i, updateItem) => (
          <>
            <ImageUploadField
              label="Icon"
              value={item.icon}
              onChange={(url) => updateItem({ ...item, icon: url })}
            />
            <TextField
              label="Title"
              value={item.title}
              onChange={(v) => updateItem({ ...item, title: v })}
            />
            <TextAreaField
              label="Description"
              rows={2}
              value={item.description}
              onChange={(v) => updateItem({ ...item, description: v })}
            />
          </>
        )}
      />
    </SectionEditorShell>
  );
}