'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Music, X } from 'lucide-react';
import { useUploadMedia } from '@/hooks/useWebsite';

interface AudioUploadFieldProps {
  label: string;
  value: string; // current audio URL, stored in section content
  onChange: (url: string) => void;
}

export function AudioUploadField({ label, value, onChange }: AudioUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const uploadMedia = useUploadMedia();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file');
      return;
    }

    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('altText', label);
    formData.append('type', 'audio');

    try {
      const res = await uploadMedia.mutateAsync(formData);
      onChange(res.data.url);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to upload audio');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        {value ? (
          <audio controls src={value} className="w-full h-10" />
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Music className="h-4 w-4" /> No audio uploaded yet
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
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
            {uploadMedia.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            {value ? 'Change Audio' : 'Upload Audio'}
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
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}