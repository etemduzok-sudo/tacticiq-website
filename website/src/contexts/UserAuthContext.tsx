import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { User, Session, AuthError, Provider } from '@supabase/supabase-js';

// =====================================================
// Types
// =====================================================

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  plan: 'free' | 'pro';
  favoriteTeams?: string[];
  preferredLanguage?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

interface UserAuthContextType {
  // State
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Auth Methods
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // Profile Methods
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

// =====================================================
// Context
// =====================================================

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

// =====================================================
// Provider
// =====================================================

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!session;
  
  // Debug log for auth state changes
  useEffect(() => {
    if (user || session) {
      console.log('🔍 Auth state update:', {
        hasUser: !!user,
        hasSession: !!session,
        isAuthenticated,
        profileLoaded: !!profile,
        userEmail: user?.email,
      });
    }
  }, [user, session, isAuthenticated, profile]);

  // Fetch user profile from Supabase or localStorage
  const fetchProfile = useCallback(async (userId: string, userEmail: string, userMetadata?: any) => {
    try {
      console.log('🔍 Fetching profile for:', userId, userEmail, 'metadata:', userMetadata);
      
      // Get name from user metadata (Google OAuth provides name in metadata)
      const metadataName = userMetadata?.name || 
                          userMetadata?.full_name || 
                          userMetadata?.display_name || 
                          null;
      
      // Try to get profile from Supabase
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('ℹ️ Profile not found, will create new one');
        } else if (fetchError.code === '42P01') {
          console.error('❌ user_profiles table does not exist! Please run SUPABASE_USER_PROFILES_TABLE.sql');
        } else {
          console.warn('⚠️ Profile fetch error:', fetchError.message, fetchError.code);
        }
      }

      if (data) {
        console.log('✅ Profile found in Supabase:', data);
        // Update name if metadata has a better name
        const profileName = metadataName || data.name || userEmail.split('@')[0];
        const userProfile: UserProfile = {
          id: data.id,
          email: userEmail,
          name: profileName,
          avatar: userMetadata?.avatar_url || userMetadata?.picture || data.avatar,
          plan: data.plan || 'free',
          favoriteTeams: data.favorite_teams || [],
          preferredLanguage: data.preferred_language || 'tr',
          createdAt: data.created_at,
          lastLoginAt: new Date().toISOString(),
        };
        setProfile(userProfile);
        localStorage.setItem('user_profile', JSON.stringify(userProfile));
        console.log('✅ Profile set in state:', userProfile);
        return userProfile;
      } else {
        // Create default profile with metadata name if available
        const defaultProfile: UserProfile = {
          id: userId,
          email: userEmail,
          name: metadataName || userEmail.split('@')[0],
          avatar: userMetadata?.avatar_url || userMetadata?.picture,
          plan: 'free',
          favoriteTeams: [],
          preferredLanguage: 'tr',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        
        // Try to insert into Supabase
        console.log('📝 Creating new profile in Supabase...');
        const { error: insertError } = await supabase.from('user_profiles').upsert({
          id: userId,
          email: userEmail,
          name: defaultProfile.name,
          avatar: defaultProfile.avatar,
          plan: 'free',
          favorite_teams: [],
          preferred_language: 'tr',
        }, {
          onConflict: 'id'
        });
        
        if (insertError) {
          console.error('❌ Profile insert error:', insertError.message, insertError.code);
          if (insertError.code === '42P01') {
            console.error('❌ user_profiles table does not exist! Please run SUPABASE_USER_PROFILES_TABLE.sql in Supabase SQL Editor');
          }
          // Continue with local profile even if Supabase insert fails
        } else {
          console.log('✅ Profile created in Supabase');
        }
        
        setProfile(defaultProfile);
        localStorage.setItem('user_profile', JSON.stringify(defaultProfile));
        console.log('✅ Profile set in state (local):', defaultProfile);
        return defaultProfile;
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
      // Fallback to localStorage
      const localProfile = localStorage.getItem('user_profile');
      if (localProfile) {
        const parsed = JSON.parse(localProfile);
        setProfile(parsed);
        return parsed;
      }
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Get initial session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('🔍 Initial session check:', currentSession ? 'Found' : 'Not found', sessionError?.message);
        
        if (sessionError) {
          console.warn('Session error:', sessionError.message);
        }

        if (currentSession) {
          console.log('✅ Session found, setting user:', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(
            currentSession.user.id, 
            currentSession.user.email || '',
            currentSession.user.user_metadata
          );
        } else {
          console.log('ℹ️ No active session');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes (OAuth callbacks, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change:', event, session?.user?.email || 'no user');
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('✅ User signed in:', session.user.email);
          setSession(session);
          setUser(session.user);
          // Fetch profile with retry logic
          try {
            await fetchProfile(
              session.user.id, 
              session.user.email || '',
              session.user.user_metadata
            );
          } catch (err) {
            console.warn('⚠️ Profile fetch failed, retrying...', err);
            // Retry after a short delay
            setTimeout(async () => {
              await fetchProfile(
                session.user.id, 
                session.user.email || '',
                session.user.user_metadata
              );
            }, 1000);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setSession(null);
        setUser(null);
        setProfile(null);
        localStorage.removeItem('user_profile');
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          console.log('🔄 User updated:', session.user.email);
          setUser(session.user);
          await fetchProfile(
            session.user.id, 
            session.user.email || '',
            session.user.user_metadata
          );
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in with Email
  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Lütfen geçerli bir e-posta adresi girin' };
      }

      if (!password || password.length === 0) {
        return { success: false, error: 'Lütfen şifrenizi girin' };
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // User-friendly error messages
        let errorMsg = signInError.message;
        if (signInError.message.includes('Invalid login credentials')) {
          errorMsg = 'E-posta veya şifre hatalı. Lütfen kontrol edin.';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMsg = 'E-posta adresinizi doğrulamanız gerekiyor. Gelen kutunuzu kontrol edin.';
        } else if (signInError.message.includes('401') || signInError.message.includes('Unauthorized')) {
          errorMsg = 'Giriş yapılamadı. Lütfen sistem yöneticisine başvurun.';
        }
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      if (data.user) {
        await fetchProfile(
          data.user.id, 
          data.user.email || '',
          data.user.user_metadata
        );
      }

      return { success: true };
    } catch (err: any) {
      // Handle network errors
      if (err.code === 'ECONNREFUSED' || err.message?.includes('network')) {
        return { success: false, error: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.' };
      }
      
      const errorMsg = err.message || 'Giriş başarısız';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up with Email
  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Lütfen geçerli bir e-posta adresi girin' };
      }

      // Validate password length
      if (password.length < 6) {
        return { success: false, error: 'Şifre en az 6 karakter olmalıdır' };
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (signUpError) {
        // User-friendly error messages
        let errorMsg = signUpError.message;
        if (signUpError.message.includes('already registered')) {
          errorMsg = 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.';
        } else if (signUpError.message.includes('invalid')) {
          errorMsg = 'Geçersiz e-posta adresi veya şifre. Lütfen kontrol edin.';
        } else if (signUpError.message.includes('401') || signUpError.message.includes('Unauthorized')) {
          errorMsg = 'E-posta ile kayıt şu anda aktif değil. Lütfen sistem yöneticisine başvurun.';
        }
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        const message = 'E-posta adresinize bir doğrulama linki gönderildi. Lütfen e-postanızı kontrol edin ve linke tıklayarak hesabınızı aktif edin.';
        setError(message);
        console.log('📧 Email confirmation required for:', email);
        return { 
          success: true, 
          error: message 
        };
      }

      // If we have both user and session, sign in was successful
      if (data.user && data.session) {
        console.log('✅ Sign up successful, session created:', data.user.email);
        setSession(data.session);
        setUser(data.user);
        setError(null);
        
        // Fetch profile and wait for it to complete
        const profile = await fetchProfile(data.user.id, data.user.email || '');
        console.log('✅ Profile fetched after signup:', profile ? 'Found' : 'Created');
        
        // Wait a bit for state to propagate
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return { success: true };
      }

      // If user exists but no session, email confirmation required
      if (data.user && !data.session) {
        // Already handled above
        return { 
          success: true, 
          error: 'E-posta adresinize bir doğrulama linki gönderildi. Lütfen e-postanızı kontrol edin ve linke tıklayarak hesabınızı aktif edin.' 
        };
      }

      // Fallback
      return { success: false, error: 'Kayıt başarısız. Lütfen tekrar deneyin.' };
    } catch (err: any) {
      // Handle network errors
      if (err.code === 'ECONNREFUSED' || err.message?.includes('network')) {
        return { success: false, error: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.' };
      }
      
      let errorMsg = err.message || 'Kayıt başarısız';
      if (err.code === 400 || err.status === 400) {
        errorMsg = 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.';
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get redirect URL - use current origin for callback
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) {
        // Check if provider is not enabled
        if (oauthError.message?.includes('not enabled') || oauthError.message?.includes('Unsupported provider')) {
          const errorMsg = 'Google ile giriş şu anda kullanılamıyor. Lütfen e-posta ile kayıt olun veya sistem yöneticisine başvurun.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
        setError(oauthError.message);
        return { success: false, error: oauthError.message };
      }

      return { success: true };
    } catch (err: any) {
      // Check for provider not enabled error in error object
      if (err?.message?.includes('not enabled') || err?.message?.includes('Unsupported provider') || err?.code === 400) {
        const errorMsg = 'Google ile giriş şu anda kullanılamıyor. Lütfen e-posta ile kayıt olun veya sistem yöneticisine başvurun.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      const errorMsg = err.message || 'Google ile giriş başarısız';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in with Apple
  const signInWithApple = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get redirect URL - use current origin for callback
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (oauthError) {
        // Check if provider is not enabled
        if (oauthError.message?.includes('not enabled') || oauthError.message?.includes('Unsupported provider')) {
          const errorMsg = 'Apple ile giriş şu anda kullanılamıyor. Lütfen e-posta ile kayıt olun veya sistem yöneticisine başvurun.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
        setError(oauthError.message);
        return { success: false, error: oauthError.message };
      }

      return { success: true };
    } catch (err: any) {
      // Check for provider not enabled error in error object
      if (err?.message?.includes('not enabled') || err?.message?.includes('Unsupported provider') || err?.code === 400) {
        const errorMsg = 'Apple ile giriş şu anda kullanılamıyor. Lütfen e-posta ile kayıt olun veya sistem yöneticisine başvurun.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
      const errorMsg = err.message || 'Apple ile giriş başarısız';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('user_profile');
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return { success: false, error: resetError.message };
      }

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Şifre sıfırlama başarısız';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Update password
  const updatePassword = async (newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Şifre güncelleme başarısız';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' };
    }

    try {
      // Map to Supabase column names
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.avatar) supabaseUpdates.avatar = updates.avatar;
      if (updates.plan) supabaseUpdates.plan = updates.plan;
      if (updates.favoriteTeams) supabaseUpdates.favorite_teams = updates.favoriteTeams;
      if (updates.preferredLanguage) supabaseUpdates.preferred_language = updates.preferredLanguage;
      supabaseUpdates.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(supabaseUpdates)
        .eq('id', user.id);

      if (updateError) {
        console.warn('Profile update error:', updateError.message);
      }

      // Update local state
      const newProfile = { ...profile, ...updates } as UserProfile;
      setProfile(newProfile);
      localStorage.setItem('user_profile', JSON.stringify(newProfile));

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Profil güncelleme başarısız';
      return { success: false, error: errorMsg };
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(
        user.id, 
        user.email || '',
        user.user_metadata
      );
    }
  };

  // Delete account
  const deleteAccount = async () => {
    if (!user) {
      return { success: false, error: 'Kullanıcı oturumu bulunamadı' };
    }

    setIsLoading(true);
    setError(null);
    try {
      // Delete user profile first
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.warn('Profile delete error:', profileError.message);
      }

      // Delete auth user (this will cascade delete profile via trigger)
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

      // If admin API is not available, try user deletion via RPC or direct auth
      if (authError) {
        // Fallback: Sign out and let user contact support
        await signOut();
        return { 
          success: false, 
          error: 'Hesap silme işlemi tamamlanamadı. Lütfen destek ekibimizle iletişime geçin: support@tacticiq.app' 
        };
      }

      // Clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      localStorage.removeItem('user_profile');

      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Hesap silme başarısız';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    deleteAccount,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
}

// =====================================================
// Hook
// =====================================================

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}

// Safe hook that doesn't throw
export function useUserAuthSafe() {
  return useContext(UserAuthContext);
}
