// hooks/useFans.ts
import { useQuery } from '@tanstack/react-query';
import { fansService } from '@/services/fans';

export const FANS_KEYS = {
  all: ['fans'] as const,
};

export const useFans = () => {
  return useQuery({
    queryKey: FANS_KEYS.all,
    queryFn: async () => {
      const res = await fansService.getFans();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};