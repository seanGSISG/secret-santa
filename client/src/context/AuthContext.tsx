import { createContext, useState, useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import type { User, LoginCredentials, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  wishlistEnabled: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

interface AppConfigResponse {
  wishlistEnabled: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlistEnabled, setWishlistEnabled] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const [configResult, authResult] = await Promise.allSettled([
        api.get<AppConfigResponse>('/config'),
        api.get<AuthResponse>('/auth/me'),
      ]);

      if (configResult.status === 'fulfilled') {
        setWishlistEnabled(configResult.value.wishlistEnabled);
      } else {
        console.error('Failed to load app configuration:', configResult.reason);
        setWishlistEnabled(false);
      }

      if (authResult.status === 'fulfilled') {
        setUser(authResult.value.user);
      } else {
        const error = authResult.reason;
        if (error instanceof ApiError && error.status === 401) {
          setUser(null);
        } else {
          console.error('Failed to check auth:', error);
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.name}!`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      toast.success("You've been logged out");
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if API call fails
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, wishlistEnabled, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
