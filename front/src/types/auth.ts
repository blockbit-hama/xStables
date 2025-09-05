export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  company?: string
  phone?: string
  role: UserRole
  status: UserStatus
  walletAddress?: string
  isKycVerified: boolean
  isAmlVerified: boolean
  lastLoginAt?: string
  emailVerifiedAt?: string
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  ISSUER = 'ISSUER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  company?: string
  phone?: string
  role?: UserRole
  walletAddress?: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
