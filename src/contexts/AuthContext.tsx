import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, setToken, removeToken, getToken } from '../api';
import type { User, Rol } from '../api/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: Rol | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Parameters<typeof api.auth.register>[0]) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const userData = await api.auth.me();
      setUser(userData);
    } catch {
      await removeToken();
    } finally {
      setIsLoading(false);
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.auth.login({ email, password });
    if (result.token) await setToken(result.token);
    const userData = await api.auth.me();
    setUser(userData);
  }, []);

  const register = useCallback(async (data: Parameters<typeof api.auth.register>[0]) => {
    const result = await api.auth.register(data);
    if (result.token) await setToken(result.token);
    const userData = await api.auth.me();
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
    } finally {
      await removeToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        userRole: user?.rol ?? null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
