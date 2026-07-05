'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  ward?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, accessToken: string) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Rehydrate session on mount
    const initAuth = async () => {
      const token = localStorage.getItem('__civicfix_at');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success && data.data?.user) {
          setUser(data.data.user);
        }
      } catch (error) {
        // If 401, interceptor will try to refresh. If that fails, it will clear token.
        console.error('Session rehydration failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: User, accessToken: string) => {
    localStorage.setItem('__civicfix_at', accessToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('__civicfix_at');
      setUser(null);
      router.push('/login');
    }
  };

  const refreshToken = async () => {
    try {
      const { data } = await api.post('/auth/refresh');
      if (data.success && data.data?.accessToken) {
        localStorage.setItem('__civicfix_at', data.data.accessToken);
        return data.data.accessToken;
      }
      return null;
    } catch (error) {
      localStorage.removeItem('__civicfix_at');
      setUser(null);
      return null;
    }
  };

  // Axios Interceptor for token injection and automatic refresh
  useEffect(() => {
    const requestIntercept = api.interceptors.request.use((config) => {
      const token = localStorage.getItem('__civicfix_at');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const responseIntercept = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await refreshToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          } else {
            // Refresh failed, force logout
            setUser(null);
            router.push('/login');
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestIntercept);
      api.interceptors.response.eject(responseIntercept);
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
