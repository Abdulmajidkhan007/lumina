import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { subscribeOwnRole, type UserRole } from '../lib/admin/roles';

export interface StaffAccess {
  role: UserRole;
  isAdmin: boolean;
  isStaff: boolean;
}

const StaffContext = createContext<StaffAccess | null>(null);

/** Live role of `user`; null while the first snapshot is loading. */
export function useOwnRole(user: FirebaseUser | null): UserRole | null {
  const [state, setState] = useState<{ uid: string; role: UserRole } | null>(null);
  useEffect(() => {
    if (!user) return undefined;
    return subscribeOwnRole(user, (role) => setState({ uid: user.uid, role }));
  }, [user]);
  if (!user) return 'user';
  return state?.uid === user.uid ? state.role : null;
}

export function toAccess(role: UserRole): StaffAccess {
  return { role, isAdmin: role === 'admin', isStaff: role !== 'user' };
}

export function StaffProvider({ access, children }: { access: StaffAccess; children: ReactNode }) {
  return <StaffContext.Provider value={access}>{children}</StaffContext.Provider>;
}

/** Role of the signed-in staff member; only valid under /admin. */
export function useStaff(): StaffAccess {
  const value = useContext(StaffContext);
  if (!value) throw new Error('useStaff must be used inside <StaffProvider>');
  return value;
}
