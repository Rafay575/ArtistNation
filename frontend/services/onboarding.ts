// services/onboarding.ts
import { api } from '@/lib/api';
import { OnboardingData, DraftResponse } from '@/types/onboarding';

export const onboardingService = {
  getDraft: () => api.get<DraftResponse>('/api/onboarding/draft'),
  saveDraft: (step: number, data: OnboardingData) =>
    api.post<{ message: string }>('/api/onboarding/draft', { step, data }),
  completeOnboarding: (data: OnboardingData) =>
    api.post<{ message: string; redirectUrl: string }>('/api/onboarding/complete', data),
};