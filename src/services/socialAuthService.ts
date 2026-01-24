// socialAuthService.ts - Google & Apple Sign In Service
// ✅ GERÇEK SUPABASE OAUTH IMPLEMENTASYONU
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { STORAGE_KEYS } from '../config/constants';
import { supabase } from '../config/supabase';
import profileService from './profileService';

// ✅ Platform'a göre OAuth redirect URI
const getRedirectUri = () => {
  if (Platform.OS === 'web') {
    // Web için mevcut URL'i kullan (Supabase otomatik handle eder)
    return window.location.origin;
  }
  // Mobile için deep link
  return makeRedirectUri({
    scheme: 'tacticiq',
    path: 'auth/callback',
  });
};

const redirectUri = getRedirectUri();

interface SocialAuthResult {
  success: boolean;
  user?: any;
  error?: string;
  provider?: string;
}

class SocialAuthService {
  /**
   * Google Sign In - GERÇEK SUPABASE OAUTH
   * 
   * Gereksinimler:
   * 1. Supabase Dashboard → Authentication → Providers → Google (Aktif)
   * 2. Google Cloud Console → OAuth 2.0 Client ID yapılandırılmış
   * 3. Redirect URI: tacticiq://auth/callback (app.json'da tanımlı)
   */
  async signInWithGoogle(): Promise<SocialAuthResult> {
    try {
      console.log('🔑 [socialAuth] Google Sign In başlatıldı...');
      console.log('📍 Redirect URI:', redirectUri);
      
      // ✅ GERÇEK SUPABASE OAUTH
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('❌ [socialAuth] Supabase OAuth error:', error);
        throw error;
      }
      
      if (!data.url) {
        throw new Error('OAuth URL alınamadı');
      }
      
      console.log('🌐 [socialAuth] OAuth URL açılıyor...');
      
      // Tarayıcıda OAuth sayfasını aç
      if (Platform.OS === 'web') {
        // Web'de yönlendirme yap
        window.location.href = data.url;
        return { success: true, provider: 'google' };
      } else {
        // Mobilde in-app browser kullan
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );
        
        if (result.type === 'success') {
          // Session'ı al ve kullanıcıyı senkronize et
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (sessionData?.session?.user) {
            const user = await this.syncUserToProfile(sessionData.session.user, 'google');
            console.log('✅ [socialAuth] Google Sign In başarılı');
            return { success: true, user, provider: 'google' };
          }
        }
        
        // Kullanıcı iptal etti veya hata oluştu
        if (result.type === 'cancel') {
          return { success: false, error: 'Giriş iptal edildi', provider: 'google' };
        }
      }
      
      // Session kontrolü (callback sonrası)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const user = await this.syncUserToProfile(sessionData.session.user, 'google');
        return { success: true, user, provider: 'google' };
      }
      
      return { success: false, error: 'Giriş tamamlanamadı', provider: 'google' };
      
    } catch (error: any) {
      console.error('❌ [socialAuth] Google Sign In error:', error);
      return {
        success: false,
        error: error.message || 'Google ile giriş başarısız',
        provider: 'google',
      };
    }
  }

  /**
   * Apple Sign In - GERÇEK SUPABASE OAUTH
   * 
   * Gereksinimler:
   * 1. Apple Developer Account ($99/yıl)
   * 2. Supabase Dashboard → Authentication → Providers → Apple (Aktif)
   * 3. App ID ve Service ID yapılandırılmış
   * 4. iOS/macOS cihazda test edilmeli (Web'de sınırlı destek)
   */
  async signInWithApple(): Promise<SocialAuthResult> {
    try {
      console.log('🔑 [socialAuth] Apple Sign In başlatıldı...');
      console.log('📍 Redirect URI:', redirectUri);
      
      // ✅ GERÇEK SUPABASE OAUTH
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUri,
        },
      });
      
      if (error) {
        console.error('❌ [socialAuth] Supabase OAuth error:', error);
        throw error;
      }
      
      if (!data.url) {
        throw new Error('OAuth URL alınamadı');
      }
      
      console.log('🌐 [socialAuth] OAuth URL açılıyor...');
      
      // Tarayıcıda OAuth sayfasını aç
      if (Platform.OS === 'web') {
        // Web'de yönlendirme yap
        window.location.href = data.url;
        return { success: true, provider: 'apple' };
      } else {
        // Mobilde in-app browser kullan
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        );
        
        if (result.type === 'success') {
          // Session'ı al ve kullanıcıyı senkronize et
          const { data: sessionData } = await supabase.auth.getSession();
          
          if (sessionData?.session?.user) {
            const user = await this.syncUserToProfile(sessionData.session.user, 'apple');
            console.log('✅ [socialAuth] Apple Sign In başarılı');
            return { success: true, user, provider: 'apple' };
          }
        }
        
        // Kullanıcı iptal etti veya hata oluştu
        if (result.type === 'cancel') {
          return { success: false, error: 'Giriş iptal edildi', provider: 'apple' };
        }
      }
      
      // Session kontrolü (callback sonrası)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const user = await this.syncUserToProfile(sessionData.session.user, 'apple');
        return { success: true, user, provider: 'apple' };
      }
      
      return { success: false, error: 'Giriş tamamlanamadı', provider: 'apple' };
      
    } catch (error: any) {
      console.error('❌ [socialAuth] Apple Sign In error:', error);
      return {
        success: false,
        error: error.message || 'Apple ile giriş başarısız',
        provider: 'apple',
      };
    }
  }
  
  /**
   * Supabase kullanıcısını local profile'a senkronize et
   */
  private async syncUserToProfile(supabaseUser: any, provider: string) {
    const email = supabaseUser.email || `${provider}.user@unknown.com`;
    const displayName = supabaseUser.user_metadata?.full_name || 
                        supabaseUser.user_metadata?.name ||
                        '';
    
    // ✅ İsim ve soyismi ayır
    const nameParts = displayName.trim().split(' ').filter((p: string) => p.length > 0);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // ✅ Nickname: email'in @ öncesi kısmı (OAuth için)
    const nickname = email.split('@')[0] || '';
    
    // ✅ Avatar URL
    const photoURL = supabaseUser.user_metadata?.avatar_url || 
                     supabaseUser.user_metadata?.picture || 
                     supabaseUser.user_metadata?.avatar ||
                     null;
    
    console.log('👤 [socialAuth] User metadata:', {
      displayName,
      firstName,
      lastName,
      nickname,
      photoURL,
      provider
    });
    
    const userProfile = {
      id: supabaseUser.id,
      email: email,
      username: nickname, // email'in @ öncesi
      displayName: displayName,
      name: displayName, // ProfileScreen için
      firstName: firstName,
      lastName: lastName,
      nickname: nickname,
      photoURL: photoURL,
      avatar: photoURL, // ProfileScreen için
      provider: provider,
      authenticated: true,
      createdAt: supabaseUser.created_at || new Date().toISOString(),
      // Supabase'den alınan ek bilgiler
      supabase_id: supabaseUser.id,
      last_sign_in_at: supabaseUser.last_sign_in_at,
      // ✅ OAuth ile giriş yapan kullanıcılar için profil kurulumunu tamamlanmış say
      profileSetupComplete: true,
      // ✅ Pro özellikleri
      is_pro: true,
      isPro: true,
      isPremium: true,
      plan: 'pro',
    };
    
    // AsyncStorage'a kaydet
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userProfile));
    
    // Supabase user_profiles tablosuna da kaydet
    try {
      await profileService.updateProfile({
        email: userProfile.email,
        username: userProfile.username,
        displayName: userProfile.displayName,
        name: userProfile.displayName,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        nickname: userProfile.nickname,
        photoURL: userProfile.photoURL,
        avatar: userProfile.photoURL,
        provider: provider,
      });
      console.log('✅ [socialAuth] Profil Supabase\'e senkronize edildi');
    } catch (syncError) {
      console.warn('⚠️ [socialAuth] Supabase sync hatası (devam ediliyor):', syncError);
    }
    
    return userProfile;
  }

  /**
   * Supabase auth state listener'ı başlat
   * App.tsx'te çağrılmalı
   */
  initAuthStateListener() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [socialAuth] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Kullanıcı giriş yaptı
        const provider = session.user.app_metadata?.provider || 'email';
        await this.syncUserToProfile(session.user, provider);
        console.log('✅ [socialAuth] User signed in:', session.user.email);
      } else if (event === 'SIGNED_OUT') {
        // Kullanıcı çıkış yaptı
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        console.log('👋 [socialAuth] User signed out');
      }
    });
  }
  
  /**
   * OAuth callback'i handle et (deep link'ten)
   */
  async handleOAuthCallback(url: string): Promise<SocialAuthResult> {
    try {
      console.log('📥 [socialAuth] OAuth callback:', url);
      
      // URL'den session bilgilerini çıkar
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session?.user) {
        const provider = data.session.user.app_metadata?.provider || 'oauth';
        const user = await this.syncUserToProfile(data.session.user, provider);
        return { success: true, user, provider };
      }
      
      return { success: false, error: 'Session bulunamadı' };
    } catch (error: any) {
      console.error('❌ [socialAuth] OAuth callback error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Çıkış yap (tüm provider'lar için)
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('👋 [socialAuth] Çıkış yapılıyor...');
      
      // Supabase session'ı temizle
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('⚠️ [socialAuth] Supabase signOut error:', error);
      }
      
      // Local storage'ı temizle
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.removeItem('tacticiq_user_profile');
      
      console.log('✅ [socialAuth] Çıkış başarılı');
      return { success: true };
    } catch (error: any) {
      console.error('❌ [socialAuth] SignOut error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mevcut session'ı kontrol et
   */
  async checkSession(): Promise<SocialAuthResult> {
    try {
      // Önce Supabase session'ını kontrol et
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('⚠️ [socialAuth] Session check error:', error);
      }
      
      if (session?.user) {
        const provider = session.user.app_metadata?.provider || 'email';
        const user = await this.syncUserToProfile(session.user, provider);
        return { success: true, user, provider };
      }
      
      // AsyncStorage'dan kontrol et (fallback)
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.authenticated) {
          return { success: true, user, provider: user.provider };
        }
      }
      
      return { success: false, error: 'Session bulunamadı' };
    } catch (error: any) {
      console.error('❌ [socialAuth] Check session error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is logged in with social provider
   */
  async getCurrentSocialUser(): Promise<any | null> {
    try {
      // Önce Supabase session'ını kontrol et
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const provider = session.user.app_metadata?.provider;
        if (provider === 'google' || provider === 'apple') {
          return await this.syncUserToProfile(session.user, provider);
        }
      }
      
      // AsyncStorage fallback
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      
      // Check if social provider
      if (user.provider === 'google' || user.provider === 'apple') {
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting social user:', error);
      return null;
    }
  }
}

export default new SocialAuthService();
