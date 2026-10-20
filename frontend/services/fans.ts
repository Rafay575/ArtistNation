// services/fans.ts
import { api } from '@/lib/api';

export const fansService = {
  getFans: () => api.get('/api/artist/fans'),
};