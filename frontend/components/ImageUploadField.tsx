'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { useUploadMedia } from '@/hooks/useWebsite';
import { resolveMediaUrl } from '@/lib/media';

interface ImageUploadFieldProps {
  label: string;
  value: string; // current image URL, stored in section content
  onChange: (url: string) => void;
}

export function ImageUploadField({ label, value, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const uploadMedia = useUploadMedia();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', label);
    formData.append('type', 'image');

    try {
      const res = await uploadMedia.mutateAsync(formData);
      onChange(res.data.url);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to upload image');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
          {value ? (
            <img src={resolveMediaUrl(value)} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          )}
          {uploadMedia.isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploadMedia.isPending}
          >
            {value ? 'Change Image' : 'Upload Image'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onChange('')}
              disabled={uploadMedia.isPending}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Remove
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}