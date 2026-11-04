import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('homeserve_access_token');
      const savedUser = localStorage.getItem('homeserve_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Refresh user data from server in background
          const res = await authApi.getMe();
          setUser(res.data);
          localStorage.setItem('homeserve_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session validation error:', err);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('homeserve_access_token', accessToken);
    localStorage.setItem('homeserve_refresh_token', refreshToken);
    localStorage.setItem('homeserve_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('homeserve_refresh_token');
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('homeserve_access_token');
    localStorage.removeItem('homeserve_refresh_token');
    localStorage.removeItem('homeserve_user');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('homeserve_user', JSON.stringify(userData));
  };

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

