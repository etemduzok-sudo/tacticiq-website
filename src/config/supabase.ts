import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = 'https://jxdgiskusjljlpzvrzau.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4ZGdpc2t1c2psamxwenZyemF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NTYzNTIsImV4cCI6MjA1MjMzMjM1Mn0.W4Tv6C6H_xr9T_UdUY3LgZPLMRJY1SJhvuPmw9dXYkk';

// Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Admin Authentication Service
export const adminAuthService = {
  // Admin girişi (Supabase auth kullanarak)
  async login(email: string, password: string) {
    try {
      // Hardcoded admin credentials check (fallback)
      const ADMIN_EMAIL = 'etemduzok@gmail.com';
      const ADMIN_PASSWORD = '*130923*Tdd*';
      
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Store admin session in localStorage
        const adminSession = {
          user: {
            email: ADMIN_EMAIL,
            id: 'admin-local',
            role: 'admin',
          },
          timestamp: Date.now(),
        };
        localStorage.setItem('admin_session', JSON.stringify(adminSession));
        return { success: true, user: adminSession.user };
      }

      // Try Supabase authentication as fallback
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Admin login error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Admin login exception:', error);
      return { success: false, error: 'Login failed' };
    }
  },

  // Admin çıkışı
  async logout() {
    try {
      // Clear local admin session
      localStorage.removeItem('admin_session');
      
      // Also try Supabase logout
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Admin logout error:', error);
      }
      return { success: true };
    } catch (error) {
      console.error('Admin logout exception:', error);
      return { success: true }; // Still return success for local logout
    }
  },

  // Mevcut session kontrolü
  async checkSession() {
    try {
      // Check local admin session first
      const localSession = localStorage.getItem('admin_session');
      if (localSession) {
        const parsed = JSON.parse(localSession);
        // Check if session is less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return { success: true, session: parsed };
        } else {
          // Expired session
          localStorage.removeItem('admin_session');
        }
      }

      // Check Supabase session as fallback
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return { success: false, session: null };
      }

      return { success: !!session, session };
    } catch (error) {
      console.error('Session check exception:', error);
      return { success: false, session: null };
    }
  },

  // Kullanıcı bilgilerini getir
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Get user error:', error);
        return { success: false, user: null };
      }

      return { success: true, user };
    } catch (error) {
      console.error('Get user exception:', error);
      return { success: false, user: null };
    }
  },
};