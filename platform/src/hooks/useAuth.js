import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('arkived_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.me()
      .then((result) => setUser(result.user))
      .catch(() => {
        localStorage.removeItem('arkived_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signInAsDemo() {
        localStorage.setItem('arkived_token', 'dev-admin-token');
        window.location.assign('/dashboard');
      },
      signOut() {
        localStorage.removeItem('arkived_token');
        window.location.assign('/login');
      }
    }),
    [user, loading]
  );

  return value;
};
