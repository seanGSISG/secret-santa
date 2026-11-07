import { createContext, useState, useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { DEFAULT_LANGUAGE, DEFAULT_PUBLIC_CONFIG } from '@/lib/appConfig';
import { translate } from '@/lib/i18n';
import type { Language, PublicConfig, User, LoginCredentials, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  wishlistEnabled: boolean;
  config: PublicConfig;
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  setDrawParticipation: (participatesInDraw: boolean) => Promise<void>;
  deleteAccount: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<PublicConfig>(DEFAULT_PUBLIC_CONFIG);
  const [language, setLanguageState] = useState<Language>(() => {
    const storedLanguage = localStorage.getItem('language');
    return storedLanguage === 'fr' || storedLanguage === 'en' ? storedLanguage : DEFAULT_LANGUAGE;
  });

  const setLanguage = async (newLanguage: Language) => {
    if (user) {
      await api.put('/auth/language', { language: newLanguage });
      setUser({ ...user, language: newLanguage });
    }
    localStorage.setItem('language', newLanguage);
    setLanguageState(newLanguage);
  };

  const setDrawParticipation = async (participatesInDraw: boolean) => {
    await api.put('/admin/draw-participation', { participatesInDraw });
    setUser((currentUser) => currentUser
      ? { ...currentUser, participatesInDraw }
      : currentUser);
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/auth/me');
    } catch (error) {
      if (error instanceof ApiError && error.accountDeleted) {
        setUser(null);
      }
      throw error;
    }
    setUser(null);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const checkAuth = async () => {
      const [configResult, authResult] = await Promise.allSettled([
        api.get<PublicConfig>('/config'),
        api.get<AuthResponse>('/auth/me'),
      ]);

      if (configResult.status === 'fulfilled') {
        setConfig(configResult.value);
        document.title = configResult.value.pageTitle;
      } else {
        console.error('Failed to load app configuration:', configResult.reason);
        setConfig(DEFAULT_PUBLIC_CONFIG);
      }

      if (authResult.status === 'fulfilled') {
        setUser(authResult.value.user);
        setLanguageState(authResult.value.user.language);
        localStorage.setItem('language', authResult.value.user.language);
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
      toast.error(translate(language, 'Session expired. Please log in again.'));
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [language]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      setUser(response.user);
      setLanguageState(response.user.language);
      localStorage.setItem('language', response.user.language);
      toast.success(response.user.language === 'fr'
        ? `Bon retour, ${response.user.name} !`
        : `Welcome back, ${response.user.name}!`, {
          duration: 2500,
          closeButton: true,
        });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(translate(language, 'An unexpected error occurred'));
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      toast.success(translate(language, "You've been logged out"));
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if API call fails
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      wishlistEnabled: config.wishlistEnabled,
      config,
      language,
      setLanguage,
      setDrawParticipation,
      deleteAccount,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
