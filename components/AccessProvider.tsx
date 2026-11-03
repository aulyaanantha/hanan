'use client';

import { createContext, useContext, type ReactNode } from 'react';

const PersonalSavingsAccess = createContext(false);
const MemberName = createContext<'Farhan' | 'Anantha' | null>(null);

export function AccessProvider({ canAccessPersonalSavings, memberName, children }: {
  canAccessPersonalSavings: boolean;
  memberName: 'Farhan' | 'Anantha' | null;
  children: ReactNode;
}) {
  return <MemberName.Provider value={memberName}><PersonalSavingsAccess.Provider value={canAccessPersonalSavings}>{children}</PersonalSavingsAccess.Provider></MemberName.Provider>;
}

export function useMemberName() { return useContext(MemberName); }

export function usePersonalSavingsAccess() {
  return useContext(PersonalSavingsAccess);
}
