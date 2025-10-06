'use client';

import { useEffect, ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import React from 'react';

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const AuthComponent = (props: P) => {
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login');
        }
      };

      checkAuth();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          router.replace('/login');
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    }, [router]);

    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;