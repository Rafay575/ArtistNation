// lib/queries/useWebsiteConfig.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { WebsiteConfig } from "@/types/website";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function resolveImagePaths<T>(value: T): T {
  if (typeof value === "string") {
    return (value.startsWith("/uploads/") ? `${API_BASE_URL}${value}` : value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(resolveImagePaths) as unknown as T;
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = resolveImagePaths(val);
    }
    return result as T;
  }
  return value;
}

async function fetchWebsiteConfig(): Promise<WebsiteConfig> {
  const { data } = await api.get<WebsiteConfig>("/api/website");
  return resolveImagePaths(data);
}

export function useWebsiteConfig() {
  return useQuery({
    queryKey: ["website-config"],
    queryFn: fetchWebsiteConfig,
    staleTime: 5 * 60 * 1000, // 5 min — this content doesn't change often
    refetchOnWindowFocus: false,
  });
}