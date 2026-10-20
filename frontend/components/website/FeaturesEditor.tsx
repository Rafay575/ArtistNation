// components/admin/website/FeaturesEditor.tsx
"use client";

import { useSectionForm } from "@/hooks/useSectionForm";
import { SectionEditorShell } from "@/components/SectionEditorShell";
import { RepeatingFieldArray } from "@/components/RepeatingFieldArray";
import { TextField, TextAreaField } from "@/components/TextFields";
import type { FeaturesConfig, FeatureItem } from "@/types/website";

export function FeaturesEditor({ initialValue }: { initialValue: FeaturesConfig }) {
  const { value, update, dirty, save, isSaving, isSuccess, error } = useSectionForm(
    "features",
    initialValue
  );

  return (
    <SectionEditorShell
      title="Features"
      dirty={dirty}
      isSaving={isSaving}
      isSuccess={isSuccess}
      error={error}
      onSave={save}
    >
      <TextField label="Tag" value={value.tag} onChange={(v) => update({ ...value, tag: v })} />
      <TextField label="Heading" value={value.heading} onChange={(v) => update({ ...value, heading: v })} />
      <TextAreaField
        label="Subtext"
        rows={2}
        value={value.subtext}
        onChange={(v) => update({ ...value, subtext: v })}
      />

      <RepeatingFieldArray<FeatureItem>
        label="Feature items"
        items={value.items}
        onChange={(items) => update({ ...value, items })}
        itemLabel={(i) => `Feature ${i + 1}`}
        makeNewItem={() => ({ title: "", description: "", icon: "✨" })}
        renderItem={(item, _i, updateItem) => (
          <>
            <TextField
              label="Emoji icon"
              value={item.icon}
              onChange={(v) => updateItem({ ...item, icon: v })}
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