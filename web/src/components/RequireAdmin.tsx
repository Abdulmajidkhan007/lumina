import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAIL } from '../lib/constants';
import { AccessDenied } from '../pages/admin/AccessDenied';
import { LoadingState } from './StateViews';

/**
 * Gates `/admin`: signed-in AND `firebaseUser.email === ADMIN_EMAIL`.
 * Anyone else (signed out, or signed in as a different account) sees the
 * "Access denied" page in place of the admin shell — no redirect.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { firebaseUser, initializing } = useAuth();

  if (initializing) {
    return <LoadingState label="Checking access…" />;
  }

  const isAdmin = firebaseUser?.email === ADMIN_EMAIL;
  if (!isAdmin) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
