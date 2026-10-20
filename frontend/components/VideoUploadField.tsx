'use client';
import { useState } from 'react';
import { useUploadMedia } from '@/hooks/useWebsite';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';

export function VideoUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const uploadMedia = useUploadMedia();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'video');
      const res = await uploadMedia.mutateAsync(fd);
      onChange(res.data.url);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {value ? (
        <div className="flex items-center gap-3">
          <video src={value} className="w-40 h-24 rounded-md object-cover bg-black" controls />
          <Button variant="outline" size="sm" onClick={() => onChange('')}>
            <X className="w-4 h-4 mr-1" /> Remove
          </Button>
        </div>
      ) : (
        <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/40 text-sm">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Choose video file'}
          <input type="file" accept="video/*" hidden onChange={handleFile} />
        </label>
      )}
    </div>
  );
}