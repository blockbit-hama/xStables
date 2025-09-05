import { apiClient } from './client';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/auth';

export const authApi = {
  // 로그인
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // 회원가입
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // 프로필 조회
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  // 토큰 갱신
  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  // 비밀번호 변경
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/change-password', data);
    return response.data;
  },

  // 비밀번호 재설정 요청
  resetPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', { email });
    return response.data;
  },

  // 이메일 인증
  verifyEmail: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/verify-email');
    return response.data;
  },
};
