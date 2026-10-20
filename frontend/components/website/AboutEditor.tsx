// components/admin/website/AboutEditor.tsx
"use client";

import { useSectionForm } from "@/hooks/useSectionForm";
import { SectionEditorShell } from "@/components/SectionEditorShell";
import { RepeatingFieldArray } from "@/components/RepeatingFieldArray";
import {
  TextField,
  TextAreaField,
  CheckboxField,
} from "@/components/TextFields";
import { ImageUploadField } from "@/components/ImageUploadField";
import type { AboutConfig, ArtistCard } from "@/types/website";

export function AboutEditor({ initialValue }: { initialValue: AboutConfig }) {
  const { value, update, dirty, save, isSaving, isSuccess, error } = useSectionForm(
    "about",
    initialValue
  );

  return (
    <SectionEditorShell
      title="About"
      dirty={dirty}
      isSaving={isSaving}
      isSuccess={isSuccess}
      error={error}
      onSave={save}
    >
      <TextField label="Section tag" value={value.title} onChange={(v) => update({ ...value, title: v })} />
      <TextField label="Heading" value={value.heading} onChange={(v) => update({ ...value, heading: v })} />
      <TextAreaField
        label="Description"
        value={value.description1}
        onChange={(v) => update({ ...value, description1: v })}
      />

      <ImageUploadField
        label="Founder photo"
        value={value.image}
        onChange={(url) => update({ ...value, image: url })}
      />
      <TextField
        label="Founder name"
        value={value.founderName}
        onChange={(v) => update({ ...value, founderName: v })}
      />
      <TextField
        label="Founder title"
        value={value.founderTitle}
        onChange={(v) => update({ ...value, founderTitle: v })}
      />
      <TextAreaField
        label="Founder bio"
        value={value.founderBio}
        onChange={(v) => update({ ...value, founderBio: v })}
      />
      <TextField
        label="CTA button text"
        value={value.ctaText}
        onChange={(v) => update({ ...value, ctaText: v })}
      />

      <RepeatingFieldArray<ArtistCard>
        label="Artist cards"
        items={value.artistCards}
        onChange={(items) => update({ ...value, artistCards: items })}
        itemLabel={(i) => `Card ${i + 1}`}
        makeNewItem={() => ({ src: "", name: "", subtitle: "", verified: false })}
        renderItem={(card, _i, updateItem) => (
          <>
            <ImageUploadField
              label="Image"
              value={card.src}
              onChange={(url) => updateItem({ ...card, src: url })}
            />
            <TextField label="Name" value={card.name} onChange={(v) => updateItem({ ...card, name: v })} />
            <TextField
              label="Subtitle"
              value={card.subtitle}
              onChange={(v) => updateItem({ ...card, subtitle: v })}
            />
            <CheckboxField
              label="Verified badge"
              checked={card.verified}
              onChange={(v) => updateItem({ ...card, verified: v })}
            />
          </>
        )}
      />
    </SectionEditorShell>
  );
}