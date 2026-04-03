'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null = null;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        router.replace('/auth/login');
        return;
      }

      setIsAuthenticated(true);
      setIsLoading(false);

      const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          router.replace('/auth/login');
        }
      });

      subscription = authData.subscription;
    };

    void checkSession();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement utilisateur...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
