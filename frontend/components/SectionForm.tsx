'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';
import { AudioUploadField } from './AudioUploadField';
import { ArrayField } from './ArrayField';

type SubField = { key: string; label: string; type: 'text' | 'textarea' | 'image' | 'date' | 'number' | 'audio' };

type FieldDef =
  | { key: string; label: string; type: 'text' | 'textarea' }
  | { key: string; label: string; type: 'image' | 'audio' }
  | {
      key: string;
      label: string;
      type: 'slider';
      min: number;
      max: number;
      step: number;
      suffix?: string;
      defaultValue?: number;
      helpText?: string;
    }
  | { key: string; label: string; type: 'array-string'; itemLabel?: string; minItems?: number; maxItems?: number }
  | { key: string; label: string; type: 'array-image'; itemLabel?: string; minItems?: number; maxItems?: number }
  | { key: string; label: string; type: 'array-object'; itemLabel?: string; subFields: SubField[]; minItems?: number; maxItems?: number };

const fieldsForType: Record<string, FieldDef[]> = {
  hero: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'subheading', label: 'Subheading', type: 'text' },
    { key: 'image', label: 'Hero Image', type: 'image' },
    { key: 'ctaText', label: 'Button Text', type: 'text' },
    { key: 'ctaLink', label: 'Button Link', type: 'text' },
    // ✅ NEW: Overlay opacity slider
    {
      key: 'overlayOpacity',
      label: 'Overlay Opacity',
      type: 'slider',
      min: 0,
      max: 100,
      step: 10,
      suffix: '%',
      defaultValue: 40,
      helpText: 'Darkens the hero image so text stays readable. 0 = no overlay, 100 = fully black.',
    },
  ],
  about: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'paragraphs', label: 'Paragraphs', type: 'array-string', itemLabel: 'Paragraph' },
    { key: 'images', label: 'Images', type: 'array-image', itemLabel: 'Image' },
    { key: 'buttonText', label: 'Button Text', type: 'text' },
    { key: 'buttonLink', label: 'Button Link', type: 'text' },
  ],
  music: [
    { key: 'heading', label: 'Section Heading', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    {
      key: 'tracks',
      label: 'Tracks',
      type: 'array-object',
      itemLabel: 'Track',
      minItems: 1,
      maxItems: 3,
      subFields: [
        { key: 'trackTitle', label: 'Track Title', type: 'text' },
        { key: 'artistName', label: 'Artist Name', type: 'text' },
        { key: 'coverImage', label: 'Cover Image', type: 'image' },
        { key: 'audioUrl', label: 'Audio File (MP3 / WAV)', type: 'audio' },
      ],
    },
  ],
  events: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'image', label: 'Banner Image', type: 'image' },
    {
      key: 'events',
      label: 'Events',
      type: 'array-object',
      itemLabel: 'Event',
      maxItems: 5,
      subFields: [
        { key: 'title', label: 'Event Title', type: 'text' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'location', label: 'Location', type: 'text' },
        // ❌ Removed: description (not needed for events)
        { key: 'ticketLink', label: 'Ticket Link (Full URL)', type: 'text' },
      ],
    },
  ],
  gallery: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'images', label: 'Gallery Images', type: 'array-image', itemLabel: 'Image', maxItems: 5 },
  ],
  news: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'readMoreLink', label: 'Read More Link', type: 'text' },
    {
      key: 'newsItems',
      label: 'News Items',
      type: 'array-object',
      itemLabel: 'Article',
      maxItems: 3,
      subFields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
        { key: 'image', label: 'Image', type: 'image' },
        { key: 'link', label: 'Link', type: 'text' },
      ],
    },
  ],
  store: [
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    {
      key: 'products',
      label: 'Products',
      type: 'array-object',
      itemLabel: 'Product',
      maxItems: 3,
      subFields: [
        { key: 'name', label: 'Product Name', type: 'text' },
        { key: 'price', label: 'Price', type: 'text' },
        { key: 'image', label: 'Product Image', type: 'image' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'link', label: 'Buy Link', type: 'text' },
      ],
    },
  ],
  contact: [
    { key: 'image', label: 'Contact Image', type: 'image' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'subtitle', label: 'Subtitle', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'buttonText', label: 'Button Text', type: 'text' },
  ],
};

/**
 * Safely parse the section's content (which may be a JSON string or an object).
 */
function parseContent(section: any): Record<string, any> {
  if (!section?.content) return {};
  if (typeof section.content === 'string') {
    try {
      return JSON.parse(section.content);
    } catch {
      return {};
    }
  }
  return section.content;
}

export function SectionForm({ section, onSave, onCancel }: any) {
  const [content, setContent] = useState<Record<string, any>>(() => parseContent(section));
  const [saving, setSaving] = useState(false);

  // ✅ Sync state when the section prop changes (edit again / refetch)
  useEffect(() => {
    setContent(parseContent(section));
  }, [section?.id, section?.content]);

  const handleFieldChange = (key: string, value: any) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const defs = fieldsForType[section.type] || [];
    for (const field of defs) {
      if (field.type === 'array-object' || field.type === 'array-string' || field.type === 'array-image') {
        const arr = content[field.key] || [];
        if (field.minItems && arr.length < field.minItems) {
          alert(`At least ${field.minItems} ${field.itemLabel?.toLowerCase() || 'item'}(s) required.`);
          return;
        }
        if (field.maxItems && arr.length > field.maxItems) {
          alert(`Maximum ${field.maxItems} ${field.itemLabel?.toLowerCase() || 'item'}(s) allowed.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      await onSave({ content });
    } finally {
      setSaving(false);
    }
  };

  const fields = fieldsForType[section.type] || [];

  return (
    <div className="space-y-8">
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No editable fields are defined for this section type.
        </p>
      )}

      <div className="space-y-6">
        {fields.map((field) => {
          switch (field.type) {
            case 'text':
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={field.key} className="text-sm font-medium text-foreground">
                    {field.label}
                  </Label>
                  <Input
                    id={field.key}
                    value={content[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="max-w-xl"
                  />
                  {/* Optional helper text for optional fields */}
                  {field.key === 'ctaText' && (
                    <p className="text-xs text-muted-foreground">
                      Leave empty to hide the button entirely.
                    </p>
                  )}
                </div>
              );

            case 'textarea':
              return (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={field.key} className="text-sm font-medium text-foreground">
                    {field.label}
                  </Label>
                  <Textarea
                    id={field.key}
                    value={content[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    rows={4}
                    className="max-w-xl resize-y"
                  />
                </div>
              );

            case 'image':
              return (
                <div key={field.key} className="space-y-1.5">
                  <ImageUploadField
                    label={field.label}
                    value={content[field.key] || ''}
                    onChange={(url) => handleFieldChange(field.key, url)}
                  />
                </div>
              );

            case 'audio':
              return (
                <div key={field.key} className="space-y-1.5">
                  <AudioUploadField
                    label={field.label}
                    value={content[field.key] || ''}
                    onChange={(url) => handleFieldChange(field.key, url)}
                  />
                </div>
              );

            // ✅ NEW: Slider field
            case 'slider': {
              const rawValue = content[field.key];
              const numValue =
                typeof rawValue === 'number'
                  ? rawValue
                  : rawValue !== undefined && rawValue !== ''
                  ? Number(rawValue)
                  : field.defaultValue ?? field.min;

              return (
                <div key={field.key} className="space-y-2 max-w-xl">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.key} className="text-sm font-medium text-foreground">
                      {field.label}
                    </Label>
                    <span className="text-sm font-semibold text-purple-600 tabular-nums">
                      {numValue}
                      {field.suffix || ''}
                    </span>
                  </div>

                  <input
                    id={field.key}
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={numValue}
                    onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />

                  <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                    <span>{field.min}{field.suffix || ''}</span>
                    <span>{field.max}{field.suffix || ''}</span>
                  </div>

                  {field.helpText && (
                    <p className="text-xs text-muted-foreground pt-1">{field.helpText}</p>
                  )}
                </div>
              );
            }

            case 'array-string':
              return (
                <div key={field.key} className="rounded-lg border p-4 bg-muted/20">
                  <ArrayField
                    label={field.label}
                    mode="string"
                    itemLabel={field.itemLabel}
                    value={content[field.key] || []}
                    onChange={(val) => handleFieldChange(field.key, val)}
                    minItems={field.minItems}
                    maxItems={field.maxItems}
                  />
                </div>
              );

            case 'array-image':
              return (
                <div key={field.key} className="rounded-lg border p-4 bg-muted/20">
                  <ArrayField
                    label={field.label}
                    mode="image"
                    itemLabel={field.itemLabel}
                    value={content[field.key] || []}
                    onChange={(val) => handleFieldChange(field.key, val)}
                    minItems={field.minItems}
                    maxItems={field.maxItems}
                  />
                </div>
              );

            case 'array-object': {
              const arr = content[field.key] || [];
              const minMsg =
                field.minItems && arr.length < field.minItems
                  ? `At least ${field.minItems} ${field.itemLabel?.toLowerCase()}(s) required.`
                  : null;
              return (
                <div key={field.key} className="rounded-lg border p-4 bg-muted/20">
                  <ArrayField
                    label={field.label}
                    mode="object"
                    itemLabel={field.itemLabel}
                    subFields={field.subFields}
                    minItems={field.minItems}
                    maxItems={field.maxItems}
                    value={arr}
                    onChange={(val) => handleFieldChange(field.key, val)}
                  />
                  {minMsg && <p className="text-red-500 text-xs mt-1">{minMsg}</p>}
                </div>
              );
            }

            default:
              return null;
          }
        })}
      </div>

      <div className="flex gap-2 pt-6 border-t sticky bottom-0 bg-background">
        <Button onClick={handleSubmit} disabled={saving} className="min-w-28">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}