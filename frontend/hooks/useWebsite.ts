import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { websiteService } from '@/services/website';

export const WEBSITE_KEYS = {
  pages: ['website', 'pages'] as const,
  sections: ['website', 'sections'] as const,
  section: (id: number) => ['website', 'section', id] as const, // ← does this exist?
  media: ['website', 'media'] as const,
};

export const usePages = () => {
  return useQuery({
    queryKey: WEBSITE_KEYS.pages,
    queryFn: async () => {
      const res = await websiteService.getPages();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateSection = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: number; data: any }) =>
      websiteService.updateSection(sectionId, data),

    onSuccess: (_, variables) => {
      // Invalidate the specific section that was edited
      qc.invalidateQueries({ queryKey: WEBSITE_KEYS.section(variables.sectionId) });

      // Also invalidate the broader lists so the CMS list page refreshes
      qc.invalidateQueries({ queryKey: WEBSITE_KEYS.pages });
      qc.invalidateQueries({ queryKey: WEBSITE_KEYS.sections });
    },
  });
};

export const useAllSections = () => {
  return useQuery({
    queryKey: ['website', 'sections', 'all'],
    queryFn: async () => {
      const res = await websiteService.getAllSections();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ✅ Better — uses the typed key (same value, guaranteed to match)
export const useSection = (sectionId: number) => {
  return useQuery({
    queryKey: WEBSITE_KEYS.section(sectionId),
    queryFn: async () => {
      const res = await websiteService.getSection(sectionId);
      return res.data;
    },
    enabled: !!sectionId && !isNaN(sectionId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useMedia = () => {
  return useQuery({
    queryKey: WEBSITE_KEYS.media,
    queryFn: async () => {
      const res = await websiteService.getMedia();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Uploads a file (image/audio/whatever) and returns { id, url, message }.
// Used by ImageUploadField / AudioUploadField so they go through your
// normal axios instance (auth headers, interceptors, etc.) instead of
// a one-off fetch call.
export const useUploadMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => websiteService.uploadMedia(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WEBSITE_KEYS.media });
    },
  });
};

export const useDeleteMedia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: number) => websiteService.deleteMedia(mediaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WEBSITE_KEYS.media });
    },
  });
};


export const useSettings = () => {
  return useQuery({
    queryKey: ['website', 'settings'],
    queryFn: async () => {
      const res = await websiteService.getSettings();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => websiteService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website', 'settings'] });
    },
  });
};