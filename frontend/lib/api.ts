import axios from 'axios';
export const api = axios.create({
  baseURL: '/api/backend',
  headers: { 'Content-Type': 'application/json', 'X-ArtistNation-Request': '1' },
  timeout: 150000,
});
api.interceptors.response.use(response => response, error => {
  if (typeof window !== 'undefined') {
    const status = error.response?.status;
    if (status === 401 && window.location.pathname.startsWith('/admin/')) window.location.replace('/login');
    if (status === 403 && ['ONBOARDING_REQUIRED', 'SUBSCRIPTION_REQUIRED'].includes(error.response?.data?.error)) {
      window.location.replace(error.response.data.redirect);
    }
  }
  return Promise.reject(error);
});
