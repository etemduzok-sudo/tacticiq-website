// src/services/mockAuthService.ts
// Geçici mock authentication service (Supabase olmadan test için)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

const MOCK_USERS_KEY = 'tacticiq-mock-users';

interface MockUser {
  id: string;
  email: string;
  username: string;
  password: string;
  created_at: string;
}

class MockAuthService {
  // Get all mock users from storage
  private async getMockUsers(): Promise<MockUser[]> {
    try {
      const data = await AsyncStorage.getItem(MOCK_USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading mock users:', error);
      return [];
    }
  }

  // Save mock users to storage
  private async saveMockUsers(users: MockUser[]): Promise<void> {
    try {
      await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving mock users:', error);
    }
  }

  // Check if username is available
  async checkUsernameAvailability(username: string) {
    try {
      console.log('🔍 [mockAuth] Username kontrolü:', username);
      const users = await this.getMockUsers();
      const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
      
      const result = {
        success: true,
        available: !exists,
        message: exists ? 'Bu kullanıcı adı zaten kullanılıyor' : 'Kullanıcı adı uygun'
      };
      
      console.log('✅ [mockAuth] Username sonucu:', result);
      return result;
    } catch (error: any) {
      console.error('❌ [mockAuth] Username check error:', error);
      return { success: false, available: false, error: error.message };
    }
  }

  // Check if email is already registered
  async checkEmailAvailability(email: string) {
    try {
      console.log('🔍 [mockAuth] Email kontrolü:', email);
      const users = await this.getMockUsers();
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      
      const result = {
        success: true,
        available: !exists,
        message: exists ? 'Bu e-posta adresi zaten kayıtlı' : 'E-posta uygun'
      };
      
      console.log('✅ [mockAuth] Email sonucu:', result);
      return result;
    } catch (error: any) {
      console.error('❌ [mockAuth] Email check error:', error);
      return { success: false, available: false, error: error.message };
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, username: string) {
    try {
      console.log('📝 [mockAuth] Kayıt başladı:', { email, username });
      
      // Check username availability
      const usernameCheck = await this.checkUsernameAvailability(username);
      if (!usernameCheck.available) {
        throw new Error(usernameCheck.message || 'Bu kullanıcı adı zaten kullanılıyor');
      }

      // Check email availability
      const emailCheck = await this.checkEmailAvailability(email);
      if (!emailCheck.available) {
        throw new Error(emailCheck.message || 'Bu e-posta adresi zaten kayıtlı');
      }

      // Create new user
      const users = await this.getMockUsers();
      const newUser: MockUser = {
        id: `mock-${Date.now()}`,
        email,
        username,
        password, // In real app, this would be hashed
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      await this.saveMockUsers(users);

      // Save session
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        authenticated: true,
      }));

      console.log('✅ [mockAuth] Kayıt başarılı!');
      return { success: true, user: newUser };
    } catch (error: any) {
      console.error('❌ [mockAuth] Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      console.log('🔑 [mockAuth] Giriş denemesi:', email);
      const users = await this.getMockUsers();
      const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );

      if (!user) {
        throw new Error('E-posta veya şifre hatalı');
      }

      // Save session
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
        id: user.id,
        email: user.email,
        username: user.username,
        authenticated: true,
      }));

      console.log('✅ [mockAuth] Giriş başarılı!');
      return { success: true, user };
    } catch (error: any) {
      console.error('❌ [mockAuth] Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const users = await this.getMockUsers();
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!exists) {
        throw new Error('Bu e-posta adresi kayıtlı değil');
      }

      console.log('📧 [mockAuth] Şifre sıfırlama maili gönderildi (mock)');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [mockAuth] Reset password error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }
}

export default new MockAuthService();
