// components/admin/website/FooterEditor.tsx
"use client";

import { useSectionForm } from "@/hooks/useSectionForm";
import { SectionEditorShell } from "@/components/SectionEditorShell";
import { RepeatingFieldArray } from "@/components/RepeatingFieldArray";
import { TextField } from "@/components/TextFields";
import { ImageUploadField } from "@/components/ImageUploadField";
import type { FooterConfig, SocialIcon, FooterLink } from "@/types/website";

export function FooterEditor({ initialValue }: { initialValue: FooterConfig }) {
  const { value, update, dirty, save, isSaving, isSuccess, error } = useSectionForm(
    "footer",
    initialValue
  );

  return (
    <SectionEditorShell
      title="Footer"
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
      <TextField
        label="Brand name"
        value={value.brandName}
        onChange={(v) => update({ ...value, brandName: v })}
      />
      <TextField label="Tagline" value={value.tagline} onChange={(v) => update({ ...value, tagline: v })} />
      <TextField
        label="Subscribe input placeholder"
        value={value.subscribePlaceholder}
        onChange={(v) => update({ ...value, subscribePlaceholder: v })}
      />
      <TextField
        label="Subscribe button text"
        value={value.subscribeButtonText}
        onChange={(v) => update({ ...value, subscribeButtonText: v })}
      />
      <TextField
        label="Address"
        value={value.contactInfo.address}
        onChange={(v) => update({ ...value, contactInfo: { ...value.contactInfo, address: v } })}
      />
      <TextField
        label="Contact email"
        value={value.contactInfo.email}
        onChange={(v) => update({ ...value, contactInfo: { ...value.contactInfo, email: v } })}
      />
      <TextField
        label="Copyright text"
        value={value.copyright}
        onChange={(v) => update({ ...value, copyright: v })}
      />

      <RepeatingFieldArray<SocialIcon>
        label="Social icons"
        items={value.socialIcons}
        onChange={(items) => update({ ...value, socialIcons: items })}
        itemLabel={(i) => `Icon ${i + 1}`}
        makeNewItem={() => ({ src: "", alt: "" })}
        renderItem={(icon, _i, updateItem) => (
          <>
            <ImageUploadField
              label="Icon image"
              value={icon.src}
              onChange={(url) => updateItem({ ...icon, src: url })}
            />
            <TextField
              label="Alt text / platform name"
              value={icon.alt}
              onChange={(v) => updateItem({ ...icon, alt: v })}
            />
          </>
        )}
      />

      <RepeatingFieldArray<FooterLink>
        label="Company links"
        items={value.companyLinks}
        onChange={(items) => update({ ...value, companyLinks: items })}
        itemLabel={(i) => `Link ${i + 1}`}
        makeNewItem={() => ({ label: "", to: "" })}
        renderItem={(link, _i, updateItem) => (
          <>
            <TextField label="Label" value={link.label} onChange={(v) => updateItem({ ...link, label: v })} />
            <TextField
              label="Target (section id or path)"
              value={link.to}
              onChange={(v) => updateItem({ ...link, to: v })}
            />
          </>
        )}
      />

      <RepeatingFieldArray<FooterLink>
        label="Help links"
        items={value.helpLinks}
        onChange={(items) => update({ ...value, helpLinks: items })}
        itemLabel={(i) => `Link ${i + 1}`}
        makeNewItem={() => ({ label: "", to: "" })}
        renderItem={(link, _i, updateItem) => (
          <>
            <TextField label="Label" value={link.label} onChange={(v) => updateItem({ ...link, label: v })} />
            <TextField
              label="Target (section id or path)"
              value={link.to}
              onChange={(v) => updateItem({ ...link, to: v })}
            />
          </>
        )}
      />
    </SectionEditorShell>
  );
}