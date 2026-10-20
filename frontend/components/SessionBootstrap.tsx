'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { loginSuccess, logout } from '@/store/authSlice';
import { api } from '@/lib/api';

export default function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const initialized = useSelector((state: RootState) => state.auth.initialized);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    // Remove credentials left by the previous client-storage implementation.
    try { localStorage.removeItem('authToken'); localStorage.removeItem('user'); } catch { /* Storage is optional. */ }
    document.cookie = 'authToken=; Max-Age=0; Path=/; SameSite=Lax';
    api.get('/api/session').then(response => {
      if (active) dispatch(loginSuccess({ user: response.data.user }));
    }).catch(error => {
      if (!active) return;
      if (error.response?.status === 401) dispatch(logout());
      else setFailed(true);
    });
    return () => { active = false; };
  }, [dispatch]);
  if (failed) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p>Unable to check your session. Please try again.</p><button onClick={() => window.location.reload()}>Retry</button></div>;
  if (!initialized) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  return children;
}
