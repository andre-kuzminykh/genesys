import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from './AppStore';
import type { ReactNode } from 'react';

/** FR-GEN-100 — protected routes require a session. */
export function AuthGate({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { state } = useStore();
  const loc = useLocation();
  if (!state.session) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  if (adminOnly) {
    const me = state.users.find((u) => u.handle === state.session!.handle);
    if (me?.role !== 'admin') return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}
