'use client';

import { useMedia } from '@/hooks/useWebsite';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  userId: number;
}

export function MediaPickerModal({ open, onClose, onSelect, userId }: MediaPickerModalProps) {
  const { data: media, isLoading } = useMedia();

  const images = media?.filter((item: any) => item.type === 'image') || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select an image</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No images uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {images.map((img: any) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-md overflow-hidden border cursor-pointer hover:ring-2 hover:ring-primary transition"
                onClick={() => onSelect(img.url)}
              >
                <Image src={img.url} alt={img.alt_text || ''} fill className="object-cover" unoptimized={true} />
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}