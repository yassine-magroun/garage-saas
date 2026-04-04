'use client';

import { ReactNode } from 'react';

/**
 * Auth is intentionally disabled — guarded routes are publicly accessible.
 * Replace with real auth (Clerk / Supabase Auth) when needed.
 */
type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  return <>{children}</>;
}
