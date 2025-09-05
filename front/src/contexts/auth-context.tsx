'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/types/auth';
import { authApi } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 토큰 저장
  const saveToken = (token: string) => {
    localStorage.setItem('token', token);
  };

  // 토큰 제거
  const removeToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // 사용자 정보 저장
  const saveUser = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // 사용자 정보 제거
  const removeUser = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // 로그인
  const login = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data);
      saveToken(response.token);
      saveUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // 회원가입
  const register = async (data: RegisterRequest) => {
    try {
      const response = await authApi.register(data);
      saveToken(response.token);
      saveUser(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  // 로그아웃
  const logout = () => {
    removeToken();
    removeUser();
  };

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    try {
      const userData = await authApi.getProfile();
      saveUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  };

  // 초기 로드 시 사용자 정보 확인
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // 토큰 유효성 검증을 위해 프로필 조회
          await refreshUser();
        } catch (error) {
          console.error('Token validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
