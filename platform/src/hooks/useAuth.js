import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { hasSupabaseClient, supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (hasSupabaseClient) {
        const { data, error } = await supabase.auth.getSession();
        const token = data?.session?.access_token;

        if (error || !token) {
          localStorage.removeItem('arkived_token');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        localStorage.setItem('arkived_token', token);
      }

      const token = localStorage.getItem('arkived_token');
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }

      api.me()
        .then((result) => {
          if (!mounted) return;
          setUser(result.user);
        })
        .catch(() => {
          localStorage.removeItem('arkived_token');
          if (mounted) setUser(null);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async signInWithPassword(email, password) {
        if (!hasSupabaseClient) {
          throw new Error('Supabase is not configured. Use demo sign in for local fallback.');
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.session?.access_token) {
          throw new Error(error?.message || 'Invalid credentials');
        }

        localStorage.setItem('arkived_token', data.session.access_token);
        try {
          const me = await api.me();
          const nextPath = me?.user?.role === 'platform_owner' ? '/admin' : '/dashboard';
          window.location.assign(nextPath);
        } catch (_error) {
          window.location.assign('/dashboard');
        }
      },
      signInAsDemo() {
        localStorage.setItem('arkived_token', 'dev-admin-token');
        window.location.assign('/dashboard');
      },
      async signOut() {
        if (hasSupabaseClient) {
          await supabase.auth.signOut();
        }
        localStorage.removeItem('arkived_token');
        window.location.assign('/login');
      }
    }),
    [user, loading]
  );

  return value;
};
