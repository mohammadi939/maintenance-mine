import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'cmms_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    apiRequest('me', { token })
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        setError('');
      })
      .catch(() => {
        if (!active) return;
        setToken('');
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('login', {
        method: 'POST',
        data: { username, password },
      });
      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      const profile = await apiRequest('me', { token: data.token });
      setUser(profile.user);
      setError('');
      return profile.user;
    } catch (err) {
      const message = err.message || 'ورود ناموفق بود.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const value = useMemo(
    () => ({ token, user, loading, error, login, logout, setError }),
    [token, user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth باید داخل AuthProvider استفاده شود.');
  }
  return ctx;
}
