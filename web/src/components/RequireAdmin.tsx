import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StaffProvider, toAccess, useOwnRole, useStaff } from '../contexts/StaffContext';
import { AccessDenied } from '../pages/admin/AccessDenied';
import { LoadingState } from './StateViews';
import { useI18n } from '../i18n';

/**
 * Gates `/admin`: the owner account (verified email) or a verified account
 * with a staff role (staffRoles/{uid}: moderator | admin). Anyone else sees
 * "Access denied" in place of the admin shell — no redirect. Firestore rules
 * enforce the same split server-side; this only decides what to render.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { firebaseUser, initializing } = useAuth();
  const role = useOwnRole(firebaseUser);

  if (initializing || role === null) {
    return <LoadingState label={t('Checking access…')} />;
  }
  if (!firebaseUser || role === 'user') {
    return <AccessDenied />;
  }
  return <StaffProvider access={toAccess(role)}>{children}</StaffProvider>;
}

/** Admin-only sections (roles, broadcasts, messages, landing). */
export function RequireAdminRole({ children }: { children: ReactNode }) {
  const { isAdmin } = useStaff();
  return isAdmin ? <>{children}</> : <AccessDenied />;
}
