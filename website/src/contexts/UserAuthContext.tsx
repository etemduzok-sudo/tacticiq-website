import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { User, Session, AuthError, Provider } from '@supabase/supabase-js';

// =====================================================
// Types - v2.0 Immediate Profile Fix
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
  profileLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true); // true ile başla - auth kontrolü tamamlanana kadar
  const [error, setError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

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
  const fetchProfile = useCallback(async (userId: string, userEmail: string, userMetadata?: any): Promise<UserProfile> => {
    setProfileLoading(true);
    try {
      console.log('🔍 Fetching profile for:', userId, userEmail, 'metadata:', userMetadata);
      
      // Get name from user metadata (Google OAuth provides name in metadata)
      const metadataName = userMetadata?.name || 
                          userMetadata?.full_name || 
                          userMetadata?.display_name || 
                          null;
      
      // Check localStorage first for instant load
      const cachedProfile = localStorage.getItem('user_profile');
      if (cachedProfile) {
        try {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.id === userId) {
            console.log('✅ Using cached profile from localStorage');
            setProfile(parsed);
            setProfileLoading(false);
            
            // Fetch from Supabase in background to update cache (non-blocking)
            supabase
              .from('user_profiles')
              .select('*')
              .eq('id', userId)
              .single()
              .then(({ data, error }) => {
                if (!error && data) {
                  const profileName = metadataName || data.name || userEmail.split('@')[0];
                  const updatedProfile: UserProfile = {
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
                  setProfile(updatedProfile);
                  localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
                  console.log('🔄 Profile updated from Supabase');
                }
              });
            
            return parsed; // Return cached profile immediately
          }
        } catch (e) {
          console.warn('⚠️ Failed to parse cached profile:', e);
        }
      }
      
      // Try to get profile from Supabase with timeout
      const fetchPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise<{ data: null, error: { message: string, code: string } }>((resolve) => 
        setTimeout(() => resolve({ data: null, error: { message: 'Profile fetch timeout', code: 'TIMEOUT' } }), 8000)
      );
      
      const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]);

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('ℹ️ Profile not found in DB, creating new one');
        } else if (fetchError.code === '42P01') {
          console.error('❌ user_profiles table does not exist!');
        } else if (fetchError.code === 'TIMEOUT') {
          console.warn('⏱️ Profile fetch timeout - using fallback');
        } else {
          console.warn('⚠️ Profile fetch error:', fetchError.message, fetchError.code);
        }
      }

      if (data) {
        console.log('✅ Profile found in Supabase');
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
        
        // Set profile immediately
        setProfile(userProfile);
        localStorage.setItem('user_profile', JSON.stringify(userProfile));
        console.log('✅ Profile loaded from DB');
        setProfileLoading(false);
        return userProfile;
      }
      // CRITICAL: Create default profile immediately for first-time users
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
      
      // Set profile immediately - don't wait for anything
      setProfile(defaultProfile);
      localStorage.setItem('user_profile', JSON.stringify(defaultProfile));
      console.log('✅ Profile set in state (new user):', defaultProfile);
      setProfileLoading(false);
      
      // Try to insert into Supabase in background (non-blocking)
      console.log('📝 Creating profile in Supabase (background)...');
      supabase.from('user_profiles').upsert({
        id: userId,
        email: userEmail,
        name: defaultProfile.name,
        avatar: defaultProfile.avatar,
        plan: 'free',
        favorite_teams: [],
        preferred_language: 'tr',
      }, {
        onConflict: 'id'
      }).then(({ error: insertError }) => {
        if (insertError) {
          console.error('❌ Profile insert error (background):', insertError.message);
        } else {
          console.log('✅ Profile saved to Supabase');
        }
      }).catch(err => {
        console.error('❌ Profile insert failed (background):', err);
      });
      
      return defaultProfile;
    } catch (err) {
      console.error('❌ Profile fetch exception:', err);
      
      // Fallback to localStorage
      const localProfile = localStorage.getItem('user_profile');
      if (localProfile) {
        try {
          const parsed = JSON.parse(localProfile);
          console.log('✅ Using cached profile from localStorage:', parsed);
          setProfile(parsed);
          setProfileLoading(false);
          return parsed;
        } catch (e) {
          console.warn('⚠️ Failed to parse cached profile:', e);
        }
      }
      
      // Last resort: Create minimal profile from user data
      console.log('⚠️ Creating minimal fallback profile');
      const fallbackProfile: UserProfile = {
        id: userId,
        email: userEmail,
        name: userEmail.split('@')[0],
        plan: 'free',
        favoriteTeams: [],
        preferredLanguage: 'tr',
        createdAt: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
      localStorage.setItem('user_profile', JSON.stringify(fallbackProfile));
      console.log('✅ Fallback profile set:', fallbackProfile);
      setProfileLoading(false);
      return fallbackProfile;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let authStateHandled = false; // Flag to prevent race condition
    let mounted = true;
    
    const initAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Session kontrolü - timeout ile
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }, error: { message: string } }>((resolve) => 
          setTimeout(() => resolve({ data: { session: null }, error: { message: 'Timeout' } }), 8000)
        );
        
        const { data: { session: currentSession }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!mounted) return; // Component unmount olduysa işlemi durdur
        
        // If onAuthStateChange already handled auth, skip this
        if (authStateHandled) {
          console.log('⏭️ Session check skipped: Auth state already handled by onAuthStateChange');
          setIsLoading(false);
          return;
        }
        
        console.log('🔍 Initial session check:', currentSession ? 'Found' : 'Not found', sessionError?.message);

        if (currentSession?.user) {
          console.log('✅ Session found, setting user:', currentSession.user.email);
          
          // CRITICAL: Create immediate profile FIRST
          const metadata = currentSession.user.user_metadata;
          const metadataName = metadata?.name || metadata?.full_name || metadata?.display_name || null;
          const immediateProfile: UserProfile = {
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            name: metadataName || currentSession.user.email?.split('@')[0] || 'User',
            avatar: metadata?.avatar_url || metadata?.picture,
            plan: 'free',
            favoriteTeams: [],
            preferredLanguage: 'tr',
            createdAt: new Date().toISOString(),
          };
          
          // Set ALL states together BEFORE any async operation
          setSession(currentSession);
          setUser(currentSession.user);
          setProfile(immediateProfile);
          setIsLoading(false);
          console.log('✅ Immediate profile set (init):', immediateProfile.email);
          
          // Then fetch from DB in background to update (non-blocking)
          fetchProfile(
            currentSession.user.id, 
            currentSession.user.email || '',
            currentSession.user.user_metadata
          ).then(() => {
            console.log('✅ Profile updated from DB (init)');
          }).catch(err => {
            console.warn('⚠️ Profile fetch failed (using immediate profile):', err);
          });
        } else if (sessionError?.message === 'Timeout') {
          // Timeout - onAuthStateChange halledecek
          console.log('⏳ Session check timeout, waiting for onAuthStateChange...');
          setIsLoading(false);
        } else {
          // No session
          console.log('ℹ️ No active session');
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('❌ Auth init error:', err);
        setIsLoading(false);
      }
    };

    initAuth();
    
    // Listen for auth state changes (OAuth callbacks, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change:', event, session?.user?.email || 'no user');
      
      if (!mounted) return; // Component unmount olduysa işlemi durdur
      
      // Mark that auth state was handled by onAuthStateChange
      authStateHandled = true;
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('✅ User signed in:', session.user.email);
          
          // CRITICAL: Create immediate profile FIRST
          const metadata = session.user.user_metadata;
          const metadataName = metadata?.name || metadata?.full_name || metadata?.display_name || null;
          const immediateProfile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name: metadataName || session.user.email?.split('@')[0] || 'User',
            avatar: metadata?.avatar_url || metadata?.picture,
            plan: 'free',
            favoriteTeams: [],
            preferredLanguage: 'tr',
            createdAt: new Date().toISOString(),
          };
          
          // Set ALL states together BEFORE any async operation
          setSession(session);
          setUser(session.user);
          setProfile(immediateProfile);
          setIsLoading(false);
          console.log('✅ Immediate profile set:', immediateProfile.email);
          
          // Then fetch from DB in background to update (non-blocking)
          fetchProfile(
            session.user.id, 
            session.user.email || '',
            session.user.user_metadata
          ).then(() => {
            console.log('✅ Profile updated from DB');
          }).catch(err => {
            console.warn('⚠️ Profile fetch failed (using immediate profile):', err);
          });
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        localStorage.removeItem('user_profile');
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          console.log('🔄 User updated:', session.user.email);
          setUser(session.user);
          fetchProfile(
            session.user.id, 
            session.user.email || '',
            session.user.user_metadata
          ).catch(err => console.warn('⚠️ Profile update failed:', err));
        }
      }
    });

    return () => {
      mounted = false;
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
        setIsLoading(false);
        return { success: false, error: 'Lütfen geçerli bir e-posta adresi girin' };
      }

      if (!password || password.length === 0) {
        setIsLoading(false);
        return { success: false, error: 'Lütfen şifrenizi girin' };
      }

      // Timeout ile sign in - 10 saniye
      const signInPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<{ data: { user: null }, error: { message: string } }>((resolve) => 
        setTimeout(() => resolve({ data: { user: null }, error: { message: 'Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.' } }), 10000)
      );
      
      const { data, error: signInError } = await Promise.race([signInPromise, timeoutPromise]);

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
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      if (data.user) {
        // Profile fetch'i background'da yap
        fetchProfile(
          data.user.id, 
          data.user.email || '',
          data.user.user_metadata
        ).catch(err => console.warn('Profile fetch error:', err));
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      // Handle network errors
      if (err.code === 'ECONNREFUSED' || err.message?.includes('network')) {
        setIsLoading(false);
        return { success: false, error: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.' };
      }
      
      const errorMsg = err.message || 'Giriş başarısız';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
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
        const profile = await fetchProfile(
          data.user.id, 
          data.user.email || '',
          data.user.user_metadata
        );
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
      
      // Timeout ile OAuth
      const oauthPromise = supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      const timeoutPromise = new Promise<{ error: { message: string } }>((resolve) => 
        setTimeout(() => resolve({ error: { message: 'Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.' } }), 10000)
      );
      
      const { error: oauthError } = await Promise.race([oauthPromise, timeoutPromise]);

      if (oauthError) {
        // Check if provider is not enabled
        if (oauthError.message?.includes('not enabled') || oauthError.message?.includes('Unsupported provider')) {
          const errorMsg = 'Google ile giriş şu anda kullanılamıyor. Lütfen e-posta ile kayıt olun veya sistem yöneticisine başvurun.';
          setError(errorMsg);
          setIsLoading(false);
          return { success: false, error: errorMsg };
        }
        setError(oauthError.message);
        setIsLoading(false);
        return { success: false, error: oauthError.message };
      }

      // OAuth redirect başarılı, loading'i false yap
      // (kullanıcı Google'a yönlendirilecek)
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
      // Timeout ile Supabase signOut
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );
      
      await Promise.race([signOutPromise, timeoutPromise]).catch(() => {
        console.log('SignOut timeout, clearing local state anyway');
      });
      
      // Her durumda local state'i temizle
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('user_profile');
    } catch (err) {
      console.error('Sign out error:', err);
      // Hata olsa bile local state'i temizle
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('user_profile');
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
    profileLoading,
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
