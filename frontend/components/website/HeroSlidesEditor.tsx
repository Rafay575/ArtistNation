// components/admin/website/HeroSlidesEditor.tsx
"use client";

import { useSectionForm } from "@/hooks/useSectionForm";
import { SectionEditorShell } from "@/components/SectionEditorShell";
import { RepeatingFieldArray } from "@/components/RepeatingFieldArray";
import { TextField, TextAreaField } from "@/components/TextFields";
import { ImageUploadField } from "@/components/ImageUploadField";
import { VideoUploadField } from "@/components/VideoUploadField";
import type { HeroSlide } from "@/types/website";

// Shape of the shared hero video object
type HeroVideo = {
  type: "youtube" | "file";
  url: string;
  file: string;
};

// A single default so both hooks agree on shape
const DEFAULT_VIDEO: HeroVideo = { type: "youtube", url: "", file: "" };

export function HeroSlidesEditor({
  initialValue,
  initialVideo = DEFAULT_VIDEO,
}: {
  initialValue: HeroSlide[];
  initialVideo?: HeroVideo;
}) {
  // ---------- Slides (existing behavior) ----------
  const slidesForm = useSectionForm("heroSlides", initialValue);

  // ---------- Hero Video (new) ----------
  const videoForm = useSectionForm<HeroVideo>("heroVideo", {
    ...DEFAULT_VIDEO,
    ...(initialVideo || {}),
  });

  const video = videoForm.value;

  const updateVideo = (patch: Partial<HeroVideo>) =>
    videoForm.update({ ...video, ...patch });

  return (
    <div className="space-y-8">
      {/* ============================ SLIDES ============================ */}
      <SectionEditorShell
        title="Hero Slides"
        dirty={slidesForm.dirty}
        isSaving={slidesForm.isSaving}
        isSuccess={slidesForm.isSuccess}
        error={slidesForm.error}
        onSave={slidesForm.save}
      >
        <RepeatingFieldArray<HeroSlide>
          label="Slides"
          items={slidesForm.value}
          onChange={slidesForm.update}
          itemLabel={(i) => `Slide ${i + 1}`}
          makeNewItem={() => ({
            bg: "",
            bgAlt: "",
            headline: "",
            subtext: "",
            cta: "",
          })}
          renderItem={(slide, _i, updateItem) => (
            <>
              <ImageUploadField
                label="Background image"
                value={slide.bg}
                onChange={(url) => updateItem({ ...slide, bg: url })}
              />
              <TextField
                label="Image alt text"
                value={slide.bgAlt}
                onChange={(v) => updateItem({ ...slide, bgAlt: v })}
              />
              <TextField
                label="Headline"
                value={slide.headline}
                onChange={(v) => updateItem({ ...slide, headline: v })}
              />
              <TextAreaField
                label="Subtext"
                rows={2}
                value={slide.subtext}
                onChange={(v) => updateItem({ ...slide, subtext: v })}
              />
              <TextField
                label="Button text (CTA)"
                value={slide.cta}
                onChange={(v) => updateItem({ ...slide, cta: v })}
              />
            </>
          )}
        />
      </SectionEditorShell>

      {/* ============================ HERO VIDEO ============================ */}
      <SectionEditorShell
        title="Hero Video"
        dirty={videoForm.dirty}
        isSaving={videoForm.isSaving}
        isSuccess={videoForm.isSuccess}
        error={videoForm.error}
        onSave={videoForm.save}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            This video plays when a visitor clicks <strong>Watch Video</strong> on the hero.
            It is shared across all slides.
          </p>

          {/* Source selector */}
          <div className="space-y-1.5 flex flex-col">
            <label className="text-sm font-medium w-full">Video source</label>
            <select
              value={video.type}
              onChange={(e) =>
                updateVideo({ type: e.target.value as "youtube" | "file" })
              }
              className="w-full max-w-xl border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <option value="youtube">YouTube (paste a URL)</option>
              <option value="file">Uploaded video file</option>
            </select>
          </div>

          {/* YouTube URL */}
          {video.type === "youtube" && (
            <TextField
              label="YouTube URL"
              value={video.url}
              onChange={(v) => updateVideo({ url: v })}
              // helper text — if your TextField supports a `hint` prop, add it here
            />
          )}

          {/* File upload */}
          {video.type === "file" && (
            <VideoUploadField
              label="Video file (MP4 / WebM)"
              value={video.file}
              onChange={(url) => updateVideo({ file: url })}
            />
          )}
        </div>
      </SectionEditorShell>
    </div>
  );
}