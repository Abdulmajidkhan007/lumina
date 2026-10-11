import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './StateViews';
import { useI18n } from '../i18n';

/** Gates `/app` routes: redirects signed-out visitors to `/app/login`. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { firebaseUser, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <LoadingState label={t('Signing you in…')} />;
  }

  if (!firebaseUser) {
    return <Navigate to="/app/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
