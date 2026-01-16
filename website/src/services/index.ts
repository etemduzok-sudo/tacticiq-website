/**
 * Services Index
 * Tüm servislerin merkezi export noktası
 */

// API Services
export { apiService, default as ApiService } from './apiService';
export type { ApiResponse, ApiError } from './apiService';

// Admin Service
export { adminService, AdminService } from './adminService';

// Auth Service
export { authService, default as AuthService } from './authService';
export type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ResetPasswordData,
  ChangePasswordData,
  ForgotPasswordData,
  ResetPasswordConfirmData,
  VerifyEmailData,
} from './authService';

// Currency Service (if exists)
export * from './currencyService';

// Email Service (if exists)
export * from './emailService';