import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, removeToken, setToken, type RegisterData, type Rol, type User } from './api';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: Rol | null;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeAuthUser(resultUser: User | { id: string; email: string; rol: Rol; perfil?: unknown }): User {
  const user = resultUser as User & { perfil?: unknown };
  if (user.rol === 'PACIENTE' && !user.paciente && user.perfil) return { ...user, paciente: user.perfil as User['paciente'] };
  if (user.rol === 'PROFESIONAL' && !user.profesional && user.perfil) return { ...user, profesional: user.perfil as User['profesional'] };
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const current = await api.auth.me();
    setUser(normalizeAuthUser(current));
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const token = await getToken();
        if (token) {
          const current = await api.auth.me();
          if (mounted) setUser(normalizeAuthUser(current));
        }
      } catch {
        await removeToken();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.auth.login({ email, password });
    if (result.token) await setToken(result.token);
    setUser(normalizeAuthUser(result.user));
    await refreshUser().catch(() => undefined);
  }, [refreshUser]);

  const register = useCallback(async (data: RegisterData) => {
    const result = await api.auth.register(data);
    if (result.token) await setToken(result.token);
    setUser(normalizeAuthUser(result.user));
    await refreshUser().catch(() => undefined);
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
    } finally {
      await removeToken();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    userRole: user?.rol ?? null,
    refreshUser,
    login,
    register,
    logout,
  }), [isLoading, login, logout, refreshUser, register, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
