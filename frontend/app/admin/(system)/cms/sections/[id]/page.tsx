'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSection, useUpdateSection } from '@/hooks/useWebsite';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { SectionForm } from '@/components/SectionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EditSectionPage() {
  const params = useParams<{ id: string }>();
  const sectionId = parseInt(params.id, 10);
  const router = useRouter();

  const { data: section, isLoading, error } = useSection(sectionId);
  const updateSection = useUpdateSection();

  const handleSave = (updatedData: any) => {
    updateSection.mutate(
      { sectionId, data: updatedData },
      {
        onSuccess: () => {
          toast.success('Section updated successfully');
          router.push('/admin/cms');
        },
        onError: () => toast.error('Failed to update section'),
      }
    );
  };

  return (
    <div className="p-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/admin/cms')}
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to CMS
      </Button>

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="capitalize text-xl">
            {isLoading ? 'Loading section…' : section ? `Edit ${section.type} Section` : 'Section'}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
              <p className="text-sm text-muted-foreground">Loading section details…</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
              <p className="text-sm font-medium text-red-600">Failed to load section</p>
              <p className="text-sm text-muted-foreground">Please try again.</p>
              <Button variant="outline" size="sm" onClick={() => router.refresh()}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && !section && (
            <div className="py-16 text-center text-muted-foreground">
              Section not found.
            </div>
          )}

          {!isLoading && !error && section && (
            /**
             * ✅ FIX: Add a `key` that changes whenever the section's content changes.
             * This forces SectionForm to fully remount, so `useState` picks up
             * the fresh `initialContent` from the newly loaded section.
             */
            <SectionForm
              key={`${section.id}-${JSON.stringify(section.content)}`}
              section={section}
              onSave={handleSave}
              onCancel={() => router.push('/admin/cms')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}