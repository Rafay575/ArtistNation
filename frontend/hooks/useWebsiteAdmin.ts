// hooks/useWebsiteAdmin.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminWebsiteConfig,
  updateWebsiteSection,
  updateSectionVisibility,
  uploadWebsiteImage,
} from "@/services/websiteAdmin";
import type {
  AdminWebsiteConfig,
  HideableSection,
  SectionKey,
} from "@/types/website";

export const WEBSITE_ADMIN_QUERY_KEY = ["website-admin-config"] as const;

export function useAdminWebsiteConfig() {
  return useQuery<AdminWebsiteConfig>({
    queryKey: WEBSITE_ADMIN_QUERY_KEY,
    queryFn: getAdminWebsiteConfig,
  });
}

// Saves one section's content. On success, the backend returns the full
// updated config, so we just drop it straight into the query cache instead
// of refetching.
export function useUpdateWebsiteSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      section,
      value,
    }: {
      section: SectionKey;
      value: Record<string, unknown> | unknown[];
    }) => updateWebsiteSection(section, value),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminWebsiteConfig>(WEBSITE_ADMIN_QUERY_KEY, data);
    },
  });
}

export function useUpdateSectionVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      section,
      visible,
    }: {
      section: HideableSection;
      visible: boolean;
    }) => updateSectionVisibility(section, visible),
    onSuccess: (data) => {
      queryClient.setQueryData<AdminWebsiteConfig>(WEBSITE_ADMIN_QUERY_KEY, data);
    },
  });
}

export function useUploadWebsiteImage() {
  return useMutation({
    mutationFn: (file: File) => uploadWebsiteImage(file),
  });
}