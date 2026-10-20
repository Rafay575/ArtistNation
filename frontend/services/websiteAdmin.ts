// services/websiteAdmin.ts
import { api } from "@/lib/api"; // <-- adjust this path if your axios instance lives elsewhere
import type {
  AdminWebsiteConfig,
  SectionKey,
  HideableSection,
} from "@/types/website";

// Requests use the same-origin API gateway and its HttpOnly session cookie.

export async function getAdminWebsiteConfig(): Promise<AdminWebsiteConfig> {
  const { data } = await api.get<AdminWebsiteConfig>("/api/website/admin");
  return data;
}

// Body type is intentionally loose here (Record<string, unknown> | unknown[])
// because each section has a different shape — the caller (useSectionForm)
// is responsible for sending the right shape for the given section key.
export async function updateWebsiteSection(
  section: SectionKey,
  value: Record<string, unknown> | unknown[]
): Promise<AdminWebsiteConfig> {
  const { data } = await api.patch<AdminWebsiteConfig>(
    `/api/website/admin/${section}`,
    value
  );
  return data;
}

export async function replaceWebsiteConfig(
  fullConfig: Record<string, unknown>
): Promise<AdminWebsiteConfig> {
  const { data } = await api.put<AdminWebsiteConfig>("/api/website/admin", fullConfig);
  return data;
}

export async function updateSectionVisibility(
  section: HideableSection,
  visible: boolean
): Promise<AdminWebsiteConfig> {
  const { data } = await api.patch<AdminWebsiteConfig>(
    `/api/website/admin/visibility/${section}`,
    { visible }
  );
  return data;
}

export interface UploadImageResponse {
  url: string;
}

export async function uploadWebsiteImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("image", file); // field name must match upload.single("image") on the backend
  const { data } = await api.post<UploadImageResponse>(
    "/api/website/admin/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}