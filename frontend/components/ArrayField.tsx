'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';
import { AudioUploadField } from './AudioUploadField';

// Add 'audio' to the allowed sub‑field types
type SubFieldType = 'text' | 'textarea' | 'image' | 'date' | 'number' | 'audio';

interface SubField {
  key: string;
  label: string;
  type: SubFieldType;
}

interface ArrayFieldProps {
  label: string;
  value: any[];
  onChange: (value: any[]) => void;
  mode: 'string' | 'image' | 'object';
  subFields?: SubField[];
  itemLabel?: string;
  minItems?: number;   // NEW
  maxItems?: number;   // NEW
}

export function ArrayField({
  label,
  value,
  onChange,
  mode,
  subFields = [],
  itemLabel = 'Item',
  minItems,
  maxItems,
}: ArrayFieldProps) {
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    if (maxItems !== undefined && items.length >= maxItems) return; // respect max
    if (mode === 'object') {
      const blank: Record<string, any> = {};
      subFields.forEach((f) => (blank[f.key] = ''));
      onChange([...items, blank]);
    } else {
      onChange([...items, '']);
    }
  };

  const updateItem = (index: number, newValue: any) => {
    const next = [...items];
    next[index] = newValue;
    onChange(next);
  };

  const updateItemField = (index: number, key: string, fieldValue: any) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: fieldValue };
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const next = [...items];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next);
  };

  const atMax = maxItems !== undefined && items.length >= maxItems;
  const atMin = minItems !== undefined && items.length <= minItems;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={atMax}
          title={atMax ? `Maximum ${maxItems} items allowed` : `Add ${itemLabel}`}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add {itemLabel}
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No {itemLabel.toLowerCase()}s yet. Click "Add {itemLabel}" to create one.
        </p>
      )}

      {minItems && items.length < minItems && (
        <p className="text-xs text-red-600">
          At least {minItems} {itemLabel.toLowerCase()}{minItems > 1 ? 's' : ''} required.
        </p>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border p-3 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {itemLabel} {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  title="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => removeItem(index)}
                  title="Remove"
                  disabled={atMin} // prevent removing if already at minimum
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {mode === 'string' && (
              <Textarea
                value={item || ''}
                onChange={(e) => updateItem(index, e.target.value)}
                rows={3}
                placeholder={`Enter ${itemLabel.toLowerCase()} text`}
              />
            )}

            {mode === 'image' && (
              <ImageUploadField
                label={`${itemLabel} ${index + 1}`}
                value={item || ''}
                onChange={(url) => updateItem(index, url)}
              />
            )}

            {mode === 'object' && (
              <div className="space-y-3">
                {subFields.map((f) => (
                  <div key={f.key}>
                    {f.type === 'image' ? (
                      <ImageUploadField
                        label={f.label}
                        value={item?.[f.key] || ''}
                        onChange={(url) => updateItemField(index, f.key, url)}
                      />
                    ) : f.type === 'audio' ? (
                      <AudioUploadField
                        label={f.label}
                        value={item?.[f.key] || ''}
                        onChange={(url) => updateItemField(index, f.key, url)}
                      />
                    ) : f.type === 'textarea' ? (
                      <>
                        <Label className="text-xs">{f.label}</Label>
                        <Textarea
                          value={item?.[f.key] || ''}
                          onChange={(e) => updateItemField(index, f.key, e.target.value)}
                          rows={3}
                        />
                      </>
                    ) : (
                      <>
                        <Label className="text-xs">{f.label}</Label>
                        <Input
                          type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                          value={item?.[f.key] || ''}
                          onChange={(e) => updateItemField(index, f.key, e.target.value)}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}