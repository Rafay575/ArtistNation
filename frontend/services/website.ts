import { api } from '@/lib/api';

export const websiteService = {
  // Pages (with sections)
  getPages: () => api.get('/api/website/pages'),
  getPage: (slug: string) => api.get(`/api/website/pages/${slug}`),
  updateSection: (sectionId: number, data: any) => api.put(`/api/website/sections/${sectionId}`, data),
  getAllSections: () => api.get('/api/website/sections/all'),
  getSection: (sectionId: number) => api.get(`/api/website/sections/${sectionId}`),
  getMedia: () => api.get('/api/website/media'),
  uploadMedia: (formData: FormData) => api.post('/api/website/media', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteMedia: (mediaId: number) => api.delete(`/website/media/${mediaId}`),
  getSettings: () => api.get('/api/website/settings'),
updateSettings: (data: any) => api.put('/api/website/settings', data),
};