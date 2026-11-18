import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, tokens } from '../api/client';
import { Role, User } from '../api/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthState>(null as unknown as AuthState);

export const HOME: Record<Role, string> = { STUDENT: '/', TEACHER: '/teacher', ADMIN: '/admin' };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!tokens.access);
  const qc = useQueryClient();

  useEffect(() => {
    if (!tokens.access) return;
    api
      .get<User>('/me')
      .then(setUser)
      .catch(() => tokens.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      qc.clear();
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [qc]);

  const login = useCallback(
    async (loginValue: string, password: string) => {
      const data = await api.login(loginValue.trim(), password);
      tokens.set(data.token, data.refreshToken);
      qc.clear();
      const me = await api.get<User>('/me');
      setUser(me);
      return me;
    },
    [qc],
  );

  const logout = useCallback(async () => {
    await api.logout();
    tokens.clear();
    qc.clear();
    setUser(null);
  }, [qc]);

  const updateUser = useCallback((patch: Partial<User>) => setUser((prev) => (prev ? { ...prev, ...patch } : prev)), []);

  const value = useMemo(() => ({ user, loading, login, logout, updateUser }), [user, loading, login, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
