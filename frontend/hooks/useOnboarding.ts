// hooks/useOnboarding.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '@/services/onboarding';
import { OnboardingData } from '@/types/onboarding';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

export const ONBOARDING_KEYS = {
  draft: ['onboarding', 'draft'] as const,
};

export const useOnboardingDraft = () => {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  return useQuery({
    queryKey: [...ONBOARDING_KEYS.draft, userId],
    queryFn: async () => {
      const res = await onboardingService.getDraft();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    gcTime: 0,
  });
};

export const useSaveDraft = () => {
  return useMutation({
    mutationFn: ({ step, data }: { step: number; data: OnboardingData }) =>
      onboardingService.saveDraft(step, data),
  });
};

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OnboardingData) =>
      onboardingService.completeOnboarding(data),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ONBOARDING_KEYS.draft });
    },
  });
};
