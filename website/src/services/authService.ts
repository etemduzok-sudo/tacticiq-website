/**
 * Authentication Service
 * Kullanıcı kimlik doğrulama işlemleri için servis
 */

import { apiService } from './apiService';
import { API_ENDPOINTS } from '@/config/api.config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    plan: 'Free' | 'Premium';
  };
  token: string;
  refreshToken: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordConfirmData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailData {
  token: string;
}

class AuthService {
  /**
   * Kullanıcı girişi
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    if (response.data?.token) {
      apiService.setAuthToken(response.data.token);
      this.saveUser(response.data.user);
    }

    return response.data!;
  }

  /**
   * Kullanıcı kaydı
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );

    if (response.data?.token) {
      apiService.setAuthToken(response.data.token);
      this.saveUser(response.data.user);
    }

    return response.data!;
  }

  /**
   * Kullanıcı çıkışı
   */
  async logout(): Promise<void> {
    try {
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      apiService.removeAuthToken();
      this.clearUser();
    }
  }

  /**
   * Token yenileme
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('Refresh token bulunamadı');
    }

    const response = await apiService.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );

    if (response.data?.token) {
      apiService.setAuthToken(response.data.token);
      this.saveUser(response.data.user);
    }

    return response.data!;
  }

  /**
   * Şifre sıfırlama isteği
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
  }

  /**
   * Şifre değiştirme isteği
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  }

  /**
   * Şifremi unuttum isteği
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  }

  /**
   * Şifre sıfırlama onayı
   */
  async resetPasswordConfirm(data: ResetPasswordConfirmData): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD_CONFIRM, data);
  }

  /**
   * Email doğrulama
   */
  async verifyEmail(data: VerifyEmailData): Promise<void> {
    await apiService.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, data);
  }

  /**
   * Kullanıcı bilgilerini kaydet
   */
  private saveUser(user: AuthResponse['user']): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Kullanıcı bilgilerini temizle
   */
  private clearUser(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Mevcut kullanıcıyı getir
   */
  getCurrentUser(): AuthResponse['user'] | null {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  /**
   * Kullanıcı giriş yapmış mı kontrol et
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    const user = this.getCurrentUser();
    return !!(token && user);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;