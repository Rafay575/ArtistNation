// services/profile.ts
import { api } from '@/lib/api';
import { ProfileResponse, UpdateProfilePayload } from '@/types/profile';

export const profileService = {
  getProfile: () => api.get<ProfileResponse>('/api/profile'),
  updateProfile: (data: UpdateProfilePayload) => api.put<ProfileResponse>('/api/profile', data),
};