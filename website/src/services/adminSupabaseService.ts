/**
 * Admin Supabase Service
 * Website admin panel verilerini Supabase'de yönetir
 * localStorage fallback ile çalışır (internet yoksa)
 * 
 * TÜM VERİLER SUPABASE'DEN OKUNUR VE YAZILIR
 * localStorage sadece offline fallback olarak kullanılır
 */

import { supabase } from '../config/supabase';

// =====================================================
// Types
// =====================================================

export interface Partner {
  id: string;
  name: string;
  logo: string;
  website?: string;
  description?: string;
  category?: string;
  enabled: boolean;
  featured: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface FeatureCategory {
  id: string;
  key: string;
  title: string;
  description: string;
  emoji: string;
  featured: boolean;
  enabled: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SectionMedia {
  id: string;
  section_id: string;
  type: 'image' | 'video' | 'text';
  title: string;
  description?: string;
  url?: string;
  alt_text?: string;
  sort_order: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Game {
  id: string;
  name: string;
  logo: string;
  link: string;
  description?: string;
  enabled: boolean;
  featured: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface PressRelease {
  id: string;
  title: string;
  subtitle?: string;
  release_date: string;
  category: 'product' | 'partnership' | 'award' | 'event' | 'other';
  content: string;
  image_url?: string;
  pdf_url?: string;
  enabled: boolean;
  featured: boolean;
  author: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

export interface PressKitFile {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_type: 'logo' | 'brand-guide' | 'screenshot' | 'document' | 'other';
  format: string;
  size: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LegalDocument {
  id: string;
  document_id: string; // 'terms', 'privacy', 'cookies', 'kvkk', 'consent', 'sales', 'copyright'
  language: string; // 'tr', 'en', 'de', 'fr', 'es', 'it', 'ar', 'zh'
  title: string;
  content: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string;
  source: string;
  status: 'pending' | 'contacted' | 'converted' | 'unsubscribed';
  notes?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  welcome_email_sent: boolean;
  welcome_email_sent_at?: string;
  last_email_sent_at?: string;
  email_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  body_html: string;
  body_text?: string;
  variables: string[];
  category: 'welcome' | 'update' | 'promotion' | 'announcement' | 'custom';
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmailLog {
  id: string;
  template_id?: string;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending' | 'opened' | 'clicked';
  error_message?: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
}

export interface PartnerApplication {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  website?: string;
  company_type: 'media' | 'sports' | 'technology' | 'gaming' | 'agency' | 'other';
  partnership_type: 'advertising' | 'sponsorship' | 'content' | 'technology' | 'distribution' | 'other';
  message?: string;
  expected_reach?: string;
  budget_range?: string;
  status: 'new' | 'reviewing' | 'contacted' | 'negotiating' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_notes?: string;
  is_read: boolean;
  contacted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  linkedin?: string;
  twitter?: string;
  email?: string;
  enabled: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Advertisement {
  id: string;
  title: string;
  type: 'image' | 'video';
  placement: 'popup' | 'banner' | 'sidebar';
  media_url: string;
  link_url: string;
  duration: number;
  frequency: number;
  display_count?: number;
  current_displays: number;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

// =====================================================
// Config Service (Key-Value Store)
// =====================================================

export const configService = {
  /**
   * Belirli bir config anahtarını getir
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const { data, error } = await supabase
        .from('admin_config')
        .select('config_value')
        .eq('config_key', key)
        .single();

      if (error) {
        console.warn(`Supabase config get error for ${key}:`, error.message);
        // Fallback to localStorage
        const localData = localStorage.getItem(`admin_${key}`);
        if (localData) {
          return JSON.parse(localData) as T;
        }
        return defaultValue;
      }

      return data?.config_value as T || defaultValue;
    } catch (error) {
      console.error(`Config get error for ${key}:`, error);
      // Fallback to localStorage
      const localData = localStorage.getItem(`admin_${key}`);
      if (localData) {
        return JSON.parse(localData) as T;
      }
      return defaultValue;
    }
  },

  /**
   * Config anahtarını kaydet
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      // Always save to localStorage as backup
      localStorage.setItem(`admin_${key}`, JSON.stringify(value));

      const { error } = await supabase
        .from('admin_config')
        .upsert({
          config_key: key,
          config_value: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'config_key'
        });

      if (error) {
        console.warn(`Supabase config set error for ${key}:`, error.message);
        // localStorage'a zaten kaydettik, false dönme
        return true;
      }

      return true;
    } catch (error) {
      console.error(`Config set error for ${key}:`, error);
      // localStorage'a kaydedildi
      return true;
    }
  },

  /**
   * Tüm config'leri getir
   */
  async getAll(): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('admin_config')
        .select('config_key, config_value');

      if (error) {
        console.warn('Supabase getAll error:', error.message);
        return {};
      }

      const result: Record<string, any> = {};
      data?.forEach(item => {
        result[item.config_key] = item.config_value;
      });

      return result;
    } catch (error) {
      console.error('Config getAll error:', error);
      return {};
    }
  }
};

// =====================================================
// Partners Service
// =====================================================

export const partnersService = {
  /**
   * Tüm ortakları getir
   */
  async getAll(): Promise<Partner[]> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('Supabase partners getAll error:', error.message);
        // Fallback to localStorage
        const localData = localStorage.getItem('admin_partners');
        return localData ? JSON.parse(localData) : [];
      }

      // Sync to localStorage
      localStorage.setItem('admin_partners', JSON.stringify(data || []));
      return data || [];
    } catch (error) {
      console.error('Partners getAll error:', error);
      const localData = localStorage.getItem('admin_partners');
      return localData ? JSON.parse(localData) : [];
    }
  },

  /**
   * Ortak ekle
   */
  async add(partner: Omit<Partner, 'id' | 'created_at' | 'updated_at'>): Promise<Partner | null> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .insert({
          name: partner.name,
          logo: partner.logo,
          link: partner.link,
          category: partner.category,
          description: partner.description,
          enabled: partner.enabled,
          featured: partner.featured,
          sort_order: partner.sort_order
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase partner add error:', error.message);
        // Fallback: localStorage'a ekle
        const localId = `local_${Date.now()}`;
        const newPartner = { ...partner, id: localId } as Partner;
        const existing = JSON.parse(localStorage.getItem('admin_partners') || '[]');
        existing.push(newPartner);
        localStorage.setItem('admin_partners', JSON.stringify(existing));
        return newPartner;
      }

      // Sync to localStorage
      const existing = JSON.parse(localStorage.getItem('admin_partners') || '[]');
      existing.push(data);
      localStorage.setItem('admin_partners', JSON.stringify(existing));

      return data;
    } catch (error) {
      console.error('Partner add error:', error);
      return null;
    }
  },

  /**
   * Ortak güncelle
   */
  async update(id: string, updates: Partial<Partner>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.warn('Supabase partner update error:', error.message);
      }

      // Update localStorage
      const existing = JSON.parse(localStorage.getItem('admin_partners') || '[]');
      const index = existing.findIndex((p: Partner) => p.id === id);
      if (index !== -1) {
        existing[index] = { ...existing[index], ...updates };
        localStorage.setItem('admin_partners', JSON.stringify(existing));
      }

      return true;
    } catch (error) {
      console.error('Partner update error:', error);
      return false;
    }
  },

  /**
   * Ortak sil
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase partner delete error:', error.message);
      }

      // Remove from localStorage
      const existing = JSON.parse(localStorage.getItem('admin_partners') || '[]');
      const filtered = existing.filter((p: Partner) => p.id !== id);
      localStorage.setItem('admin_partners', JSON.stringify(filtered));

      return true;
    } catch (error) {
      console.error('Partner delete error:', error);
      return false;
    }
  }
};

// =====================================================
// Team Members Service
// =====================================================

export const teamMembersService = {
  /**
   * Tüm ekip üyelerini getir
   */
  async getAll(): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('Supabase team_members getAll error:', error.message);
        const localData = localStorage.getItem('admin_team_members');
        return localData ? JSON.parse(localData) : [];
      }

      localStorage.setItem('admin_team_members', JSON.stringify(data || []));
      return data || [];
    } catch (error) {
      console.error('Team members getAll error:', error);
      const localData = localStorage.getItem('admin_team_members');
      return localData ? JSON.parse(localData) : [];
    }
  },

  /**
   * Ekip üyesi ekle
   */
  async add(member: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMember | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          name: member.name,
          role: member.role,
          avatar: member.avatar,
          bio: member.bio,
          linkedin: member.linkedin,
          twitter: member.twitter,
          email: member.email,
          enabled: member.enabled,
          sort_order: member.sort_order
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase team member add error:', error.message);
        const localId = `local_${Date.now()}`;
        const newMember = { ...member, id: localId } as TeamMember;
        const existing = JSON.parse(localStorage.getItem('admin_team_members') || '[]');
        existing.push(newMember);
        localStorage.setItem('admin_team_members', JSON.stringify(existing));
        return newMember;
      }

      const existing = JSON.parse(localStorage.getItem('admin_team_members') || '[]');
      existing.push(data);
      localStorage.setItem('admin_team_members', JSON.stringify(existing));

      return data;
    } catch (error) {
      console.error('Team member add error:', error);
      return null;
    }
  },

  /**
   * Ekip üyesi güncelle
   */
  async update(id: string, updates: Partial<TeamMember>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.warn('Supabase team member update error:', error.message);
      }

      const existing = JSON.parse(localStorage.getItem('admin_team_members') || '[]');
      const index = existing.findIndex((m: TeamMember) => m.id === id);
      if (index !== -1) {
        existing[index] = { ...existing[index], ...updates };
        localStorage.setItem('admin_team_members', JSON.stringify(existing));
      }

      return true;
    } catch (error) {
      console.error('Team member update error:', error);
      return false;
    }
  },

  /**
   * Ekip üyesi sil
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase team member delete error:', error.message);
      }

      const existing = JSON.parse(localStorage.getItem('admin_team_members') || '[]');
      const filtered = existing.filter((m: TeamMember) => m.id !== id);
      localStorage.setItem('admin_team_members', JSON.stringify(filtered));

      return true;
    } catch (error) {
      console.error('Team member delete error:', error);
      return false;
    }
  }
};

// =====================================================
// Advertisements Service
// =====================================================

export const advertisementsService = {
  /**
   * Tüm reklamları getir
   */
  async getAll(): Promise<Advertisement[]> {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase advertisements getAll error:', error.message);
        const localData = localStorage.getItem('admin_advertisements');
        return localData ? JSON.parse(localData) : [];
      }

      localStorage.setItem('admin_advertisements', JSON.stringify(data || []));
      return data || [];
    } catch (error) {
      console.error('Advertisements getAll error:', error);
      const localData = localStorage.getItem('admin_advertisements');
      return localData ? JSON.parse(localData) : [];
    }
  },

  /**
   * Reklam ekle
   */
  async add(ad: Omit<Advertisement, 'id' | 'created_at' | 'updated_at'>): Promise<Advertisement | null> {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .insert({
          title: ad.title,
          type: ad.type,
          placement: ad.placement,
          media_url: ad.mediaUrl, // camelCase -> snake_case mapping
          link_url: ad.linkUrl || '', // camelCase -> snake_case mapping
          duration: ad.duration,
          frequency: ad.frequency,
          display_count: ad.displayCount, // camelCase -> snake_case mapping
          current_displays: ad.currentDisplays || 0, // camelCase -> snake_case mapping
          enabled: ad.enabled
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase advertisement add error:', error.message);
        const localId = `local_${Date.now()}`;
        const newAd = { ...ad, id: localId } as Advertisement;
        const existing = JSON.parse(localStorage.getItem('admin_advertisements') || '[]');
        existing.push(newAd);
        localStorage.setItem('admin_advertisements', JSON.stringify(existing));
        return newAd;
      }

      const existing = JSON.parse(localStorage.getItem('admin_advertisements') || '[]');
      existing.push(data);
      localStorage.setItem('admin_advertisements', JSON.stringify(existing));

      return data;
    } catch (error) {
      console.error('Advertisement add error:', error);
      return null;
    }
  },

  /**
   * Reklam güncelle
   */
  async update(id: string, updates: Partial<Advertisement>): Promise<boolean> {
    try {
      // camelCase -> snake_case field mapping for Supabase
      const supabaseUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.title !== undefined) supabaseUpdates.title = updates.title;
      if (updates.type !== undefined) supabaseUpdates.type = updates.type;
      if (updates.placement !== undefined) supabaseUpdates.placement = updates.placement;
      if (updates.mediaUrl !== undefined) supabaseUpdates.media_url = updates.mediaUrl;
      if (updates.linkUrl !== undefined) supabaseUpdates.link_url = updates.linkUrl;
      if (updates.duration !== undefined) supabaseUpdates.duration = updates.duration;
      if (updates.frequency !== undefined) supabaseUpdates.frequency = updates.frequency;
      if (updates.displayCount !== undefined) supabaseUpdates.display_count = updates.displayCount;
      if (updates.currentDisplays !== undefined) supabaseUpdates.current_displays = updates.currentDisplays;
      if (updates.enabled !== undefined) supabaseUpdates.enabled = updates.enabled;

      const { error } = await supabase
        .from('advertisements')
        .update(supabaseUpdates)
        .eq('id', id);

      if (error) {
        console.warn('Supabase advertisement update error:', error.message);
      }

      const existing = JSON.parse(localStorage.getItem('admin_advertisements') || '[]');
      const index = existing.findIndex((a: Advertisement) => a.id === id);
      if (index !== -1) {
        existing[index] = { ...existing[index], ...updates };
        localStorage.setItem('admin_advertisements', JSON.stringify(existing));
      }

      return true;
    } catch (error) {
      console.error('Advertisement update error:', error);
      return false;
    }
  },

  /**
   * Reklam sil
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase advertisement delete error:', error.message);
      }

      const existing = JSON.parse(localStorage.getItem('admin_advertisements') || '[]');
      const filtered = existing.filter((a: Advertisement) => a.id !== id);
      localStorage.setItem('admin_advertisements', JSON.stringify(filtered));

      return true;
    } catch (error) {
      console.error('Advertisement delete error:', error);
      return false;
    }
  }
};

// =====================================================
// Admin Logs Service
// =====================================================

export const logsService = {
  /**
   * Log ekle
   */
  async add(type: 'info' | 'success' | 'warning' | 'error', message: string, details?: any): Promise<void> {
    try {
      await supabase
        .from('admin_logs')
        .insert({
          log_type: type,
          message,
          details: details || null
        });
    } catch (error) {
      console.error('Log add error:', error);
    }
  },

  /**
   * Logları getir
   */
  async getAll(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Supabase logs getAll error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Logs getAll error:', error);
      return [];
    }
  }
};

// =====================================================
// Migration Helper - localStorage'dan Supabase'e
// =====================================================

export const migrationService = {
  /**
   * localStorage verilerini Supabase'e taşı
   */
  async migrateFromLocalStorage(): Promise<void> {
    console.log('🔄 Starting migration from localStorage to Supabase...');

    try {
      // Discount Settings
      const discountSettings = localStorage.getItem('admin_discount_settings');
      if (discountSettings) {
        await configService.set('discount_settings', JSON.parse(discountSettings));
        console.log('✅ Discount settings migrated');
      }

      // Ad Settings
      const adSettings = localStorage.getItem('admin_ad_settings');
      if (adSettings) {
        await configService.set('ad_settings', JSON.parse(adSettings));
        console.log('✅ Ad settings migrated');
      }

      // Section Settings
      const sectionSettings = localStorage.getItem('admin_section_settings');
      if (sectionSettings) {
        await configService.set('section_settings', JSON.parse(sectionSettings));
        console.log('✅ Section settings migrated');
      }

      // Partners
      const partners = localStorage.getItem('admin_partners');
      if (partners) {
        const partnerList = JSON.parse(partners);
        for (const partner of partnerList) {
          if (!partner.id.startsWith('local_')) {
            continue; // Already in Supabase
          }
          await partnersService.add({
            name: partner.name,
            logo: partner.logo || '',
            link: partner.link || '',
            category: partner.category || '',
            description: partner.description || '',
            enabled: partner.enabled ?? true,
            featured: partner.featured ?? false,
            sort_order: partner.order || partner.sort_order || 0
          });
        }
        console.log('✅ Partners migrated');
      }

      // Team Members
      const teamMembers = localStorage.getItem('admin_team_members');
      if (teamMembers) {
        const memberList = JSON.parse(teamMembers);
        for (const member of memberList) {
          if (!member.id.startsWith('local_')) {
            continue; // Already in Supabase
          }
          await teamMembersService.add({
            name: member.name,
            role: member.role || '',
            avatar: member.avatar || '',
            bio: member.bio || '',
            linkedin: member.linkedin,
            twitter: member.twitter,
            email: member.email,
            enabled: member.enabled ?? true,
            sort_order: member.order || member.sort_order || 0
          });
        }
        console.log('✅ Team members migrated');
      }

      console.log('🎉 Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }
};

// =====================================================
// Feature Categories Service
// =====================================================

export const featureCategoriesService = {
  async getAll(): Promise<FeatureCategory[]> {
    try {
      const { data, error } = await supabase
        .from('feature_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('Supabase feature_categories getAll error:', error.message);
        const localData = localStorage.getItem('admin_feature_categories');
        return localData ? JSON.parse(localData) : [];
      }

      localStorage.setItem('admin_feature_categories', JSON.stringify(data || []));
      return data || [];
    } catch (error) {
      console.error('Feature categories getAll error:', error);
      const localData = localStorage.getItem('admin_feature_categories');
      return localData ? JSON.parse(localData) : [];
    }
  },

  async add(category: Omit<FeatureCategory, 'id' | 'created_at' | 'updated_at'>): Promise<FeatureCategory | null> {
    try {
      const { data, error } = await supabase
        .from('feature_categories')
        .insert(category)
        .select()
        .single();

      if (error) {
        console.warn('Supabase feature category add error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Feature category add error:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<FeatureCategory>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feature_categories')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.warn('Supabase feature category update error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Feature category update error:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feature_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase feature category delete error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Feature category delete error:', error);
      return false;
    }
  }
};

// =====================================================
// Section Media Service
// =====================================================

export const sectionMediaService = {
  async getAll(): Promise<SectionMedia[]> {
    try {
      const { data, error } = await supabase
        .from('section_media')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('Supabase section_media getAll error:', error.message);
        const localData = localStorage.getItem('admin_section_media');
        return localData ? JSON.parse(localData) : [];
      }

      localStorage.setItem('admin_section_media', JSON.stringify(data || []));
      return data || [];
    } catch (error) {
      console.error('Section media getAll error:', error);
      const localData = localStorage.getItem('admin_section_media');
      return localData ? JSON.parse(localData) : [];
    }
  },

  async getBySectionId(sectionId: string): Promise<SectionMedia[]> {
    try {
      const { data, error } = await supabase
        .from('section_media')
        .select('*')
        .eq('section_id', sectionId)
        .eq('enabled', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('Supabase section_media getBySectionId error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Section media getBySectionId error:', error);
      return [];
    }
  },

  async add(media: Omit<SectionMedia, 'id' | 'created_at' | 'updated_at'>): Promise<SectionMedia | null> {
    try {
      const { data, error } = await supabase
        .from('section_media')
        .insert(media)
        .select()
        .single();

      if (error) {
        console.warn('Supabase section media add error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Section media add error:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<SectionMedia>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('section_media')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.warn('Supabase section media update error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Section media update error:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('section_media')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase section media delete error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Section media delete error:', error);
      return false;
    }
  }
};

// =====================================================
// Games Service
// =====================================================

export const gamesService = {
  async getAll(): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('Supabase games getAll error:', error.message);
        const localData = localStorage.getItem('admin_games');
        return localData ? JSON.parse(localData) : [];
      }

      localStorage.setItem('admin_games', JSON.stringify(data || []));
      return data || [];
    } catch (error) {
      console.error('Games getAll error:', error);
      const localData = localStorage.getItem('admin_games');
      return localData ? JSON.parse(localData) : [];
    }
  },

  async add(game: Omit<Game, 'id' | 'created_at' | 'updated_at'>): Promise<Game | null> {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert(game)
        .select()
        .single();

      if (error) {
        console.warn('Supabase game add error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Game add error:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Game>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.warn('Supabase game update error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Game update error:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase game delete error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Game delete error:', error);
      return false;
    }
  }
};

// =====================================================
// Press Releases Service
// =====================================================

export const pressReleasesService = {
  async getAll(): Promise<PressRelease[]> {
    try {
      const { data, error } = await supabase
        .from('press_releases')
        .select('*')
        .order('release_date', { ascending: false });

      if (error) {
        console.warn('Supabase press_releases getAll error:', error.message);
        const localData = localStorage.getItem('admin_press_releases');
        return localData ? JSON.parse(localData) : [];
      }

      localStorage.setItem('admin_press_releases', JSON.stringify(data || []));
      return data || [];
    } catch (error) {
      console.error('Press releases getAll error:', error);
      const localData = localStorage.getItem('admin_press_releases');
      return localData ? JSON.parse(localData) : [];
    }
  },

  async add(release: Omit<PressRelease, 'id' | 'created_at' | 'updated_at'>): Promise<PressRelease | null> {
    try {
      const { data, error } = await supabase
        .from('press_releases')
        .insert(release)
        .select()
        .single();

      if (error) {
        console.warn('Supabase press release add error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Press release add error:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<PressRelease>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('press_releases')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.warn('Supabase press release update error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Press release update error:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('press_releases')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase press release delete error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Press release delete error:', error);
      return false;
    }
  }
};

// =====================================================
// Press Kit Files Service
// =====================================================

export const pressKitFilesService = {
  async getAll(): Promise<PressKitFile[]> {
    try {
      const { data, error } = await supabase
        .from('press_kit_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase press_kit_files getAll error:', error.message);
        const localData = localStorage.getItem('admin_pressKitFiles');
        return localData ? JSON.parse(localData) : [];
      }

      localStorage.setItem('admin_pressKitFiles', JSON.stringify(data || []));
      return data || [];
    } catch (error) {
      console.error('Press kit files getAll error:', error);
      const localData = localStorage.getItem('admin_pressKitFiles');
      return localData ? JSON.parse(localData) : [];
    }
  },

  async add(file: Omit<PressKitFile, 'id' | 'created_at' | 'updated_at'>): Promise<PressKitFile | null> {
    try {
      const { data, error } = await supabase
        .from('press_kit_files')
        .insert(file)
        .select()
        .single();

      if (error) {
        console.warn('Supabase press kit file add error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Press kit file add error:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<PressKitFile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('press_kit_files')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.warn('Supabase press kit file update error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Press kit file update error:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('press_kit_files')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase press kit file delete error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Press kit file delete error:', error);
      return false;
    }
  }
};

// =====================================================
// Sync Service - Tüm verileri Supabase'den çek
// =====================================================

export const syncService = {
  /**
   * Tüm verileri Supabase'den çek ve localStorage'a kaydet
   */
  async syncAll(): Promise<boolean> {
    console.log('🔄 Syncing all data from Supabase...');
    
    try {
      // Config values
      const configs = await configService.getAll();
      if (configs.price_settings) {
        localStorage.setItem('admin_price_settings', JSON.stringify(configs.price_settings));
      }
      if (configs.discount_settings) {
        localStorage.setItem('admin_discount_settings', JSON.stringify(configs.discount_settings));
      }
      if (configs.ad_settings) {
        localStorage.setItem('admin_ad_settings', JSON.stringify(configs.ad_settings));
      }
      if (configs.section_settings) {
        localStorage.setItem('admin_section_settings', JSON.stringify(configs.section_settings));
      }
      if (configs.notification_settings) {
        localStorage.setItem('admin_notification_settings', JSON.stringify(configs.notification_settings));
      }

      // Other data
      await partnersService.getAll();
      await teamMembersService.getAll();
      await advertisementsService.getAll();
      await featureCategoriesService.getAll();
      await sectionMediaService.getAll();
      await gamesService.getAll();
      await pressReleasesService.getAll();
      await pressKitFilesService.getAll();

      console.log('✅ Sync completed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return false;
    }
  },

  /**
   * Sadece config değerlerini Supabase'den çek
   */
  async syncConfigs(): Promise<Record<string, any>> {
    try {
      const configs = await configService.getAll();
      return configs;
    } catch (error) {
      console.error('Sync configs error:', error);
      return {};
    }
  }
};

// =====================================================
// Waitlist Service (Bekleme Listesi)
// =====================================================

export const waitlistService = {
  async getAll(): Promise<WaitlistEntry[]> {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase waitlist getAll error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Waitlist getAll error:', error);
      return [];
    }
  },

  async getByStatus(status: WaitlistEntry['status']): Promise<WaitlistEntry[]> {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase waitlist getByStatus error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Waitlist getByStatus error:', error);
      return [];
    }
  },

  async add(entry: { email: string; name?: string; source?: string }): Promise<WaitlistEntry | null> {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .insert({
          email: entry.email,
          name: entry.name || '',
          source: entry.source || 'website',
          status: 'pending',
          welcome_email_sent: false,
          email_count: 0
        })
        .select()
        .single();

      if (error) {
        // Duplicate email
        if (error.code === '23505') {
          console.warn('Email already exists in waitlist:', entry.email);
          return null;
        }
        console.warn('Supabase waitlist add error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Waitlist add error:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<WaitlistEntry>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.warn('Supabase waitlist update error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Waitlist update error:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase waitlist delete error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Waitlist delete error:', error);
      return false;
    }
  },

  async markWelcomeEmailSent(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({
          welcome_email_sent: true,
          welcome_email_sent_at: new Date().toISOString(),
          email_count: 1
        })
        .eq('id', id);

      if (error) {
        console.warn('Supabase waitlist markWelcomeEmailSent error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Waitlist markWelcomeEmailSent error:', error);
      return false;
    }
  },

  async getStats(): Promise<{ total: number; pending: number; contacted: number; converted: number }> {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('status');

      if (error) {
        console.warn('Supabase waitlist getStats error:', error.message);
        return { total: 0, pending: 0, contacted: 0, converted: 0 };
      }

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(e => e.status === 'pending').length || 0,
        contacted: data?.filter(e => e.status === 'contacted').length || 0,
        converted: data?.filter(e => e.status === 'converted').length || 0
      };

      return stats;
    } catch (error) {
      console.error('Waitlist getStats error:', error);
      return { total: 0, pending: 0, contacted: 0, converted: 0 };
    }
  }
};

// =====================================================
// Email Templates Service
// =====================================================

export const emailTemplatesService = {
  async getAll(): Promise<EmailTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase email_templates getAll error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Email templates getAll error:', error);
      return [];
    }
  },

  async getBySlug(slug: string): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.warn('Supabase email_templates getBySlug error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Email templates getBySlug error:', error);
      return null;
    }
  },

  async add(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert(template)
        .select()
        .single();

      if (error) {
        console.warn('Supabase email template add error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Email template add error:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<EmailTemplate>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.warn('Supabase email template update error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email template update error:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase email template delete error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email template delete error:', error);
      return false;
    }
  }
};

// =====================================================
// Email Logs Service
// =====================================================

export const emailLogsService = {
  async getAll(): Promise<EmailLog[]> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) {
        console.warn('Supabase email_logs getAll error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Email logs getAll error:', error);
      return [];
    }
  },

  async add(log: Omit<EmailLog, 'id'>): Promise<EmailLog | null> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .insert(log)
        .select()
        .single();

      if (error) {
        console.warn('Supabase email log add error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Email log add error:', error);
      return null;
    }
  }
};

// =====================================================
// Partner Applications Service (Ortaklık Başvuruları)
// =====================================================

export const partnerApplicationsService = {
  async getAll(): Promise<PartnerApplication[]> {
    try {
      const { data, error } = await supabase
        .from('partner_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase partner_applications getAll error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Partner applications getAll error:', error);
      return [];
    }
  },

  async getUnread(): Promise<PartnerApplication[]> {
    try {
      const { data, error } = await supabase
        .from('partner_applications')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase partner_applications getUnread error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Partner applications getUnread error:', error);
      return [];
    }
  },

  async add(application: Omit<PartnerApplication, 'id' | 'status' | 'priority' | 'is_read' | 'created_at' | 'updated_at'>): Promise<PartnerApplication | null> {
    try {
      const { data, error } = await supabase
        .from('partner_applications')
        .insert({
          ...application,
          status: 'new',
          priority: 'medium',
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase partner application add error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Partner application add error:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<PartnerApplication>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('partner_applications')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.warn('Supabase partner application update error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Partner application update error:', error);
      return false;
    }
  },

  async markAsRead(id: string): Promise<boolean> {
    return this.update(id, { is_read: true });
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('partner_applications')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase partner application delete error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Partner application delete error:', error);
      return false;
    }
  },

  async getStats(): Promise<{ total: number; unread: number; new: number; reviewing: number }> {
    try {
      const { data, error } = await supabase
        .from('partner_applications')
        .select('status, is_read');

      if (error) {
        console.warn('Supabase partner_applications getStats error:', error.message);
        return { total: 0, unread: 0, new: 0, reviewing: 0 };
      }

      const stats = {
        total: data?.length || 0,
        unread: data?.filter(a => !a.is_read).length || 0,
        new: data?.filter(a => a.status === 'new').length || 0,
        reviewing: data?.filter(a => a.status === 'reviewing').length || 0
      };

      return stats;
    } catch (error) {
      console.error('Partner applications getStats error:', error);
      return { total: 0, unread: 0, new: 0, reviewing: 0 };
    }
  }
};

// =====================================================
// Legal Documents Service
// =====================================================

export const legalDocumentsService = {
  async getAll(): Promise<LegalDocument[]> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .order('document_id', { ascending: true })
        .order('language', { ascending: true });

      if (error) {
        console.warn('Supabase legal documents getAll error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Legal documents getAll error:', error);
      return [];
    }
  },

  async getByDocumentId(documentId: string): Promise<LegalDocument[]> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('document_id', documentId)
        .order('language', { ascending: true });

      if (error) {
        console.warn('Supabase legal documents getByDocumentId error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Legal documents getByDocumentId error:', error);
      return [];
    }
  },

  async getByLanguage(language: string): Promise<LegalDocument[]> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('language', language)
        .order('document_id', { ascending: true });

      if (error) {
        console.warn('Supabase legal documents getByLanguage error:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Legal documents getByLanguage error:', error);
      return [];
    }
  },

  async get(documentId: string, language: string): Promise<LegalDocument | null> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('document_id', documentId)
        .eq('language', language)
        .single();

      if (error) {
        console.warn('Supabase legal document get error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Legal document get error:', error);
      return null;
    }
  },

  async add(document: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'>): Promise<LegalDocument | null> {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .insert({
          ...document,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase legal document add error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Legal document add error:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<LegalDocument>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('legal_documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.warn('Supabase legal document update error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Legal document update error:', error);
      return false;
    }
  },

  async upsert(document: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'>): Promise<LegalDocument | null> {
    try {
      // Önce mevcut kaydı kontrol et
      const existing = await this.get(document.document_id, document.language);
      
      if (existing) {
        // Güncelle
        const updated = await this.update(existing.id, document);
        if (updated) {
          return await this.get(document.document_id, document.language);
        }
        return null;
      } else {
        // Yeni ekle
        return await this.add(document);
      }
    } catch (error) {
      console.error('Legal document upsert error:', error);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('legal_documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase legal document delete error:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Legal document delete error:', error);
      return false;
    }
  }
};

export default {
  config: configService,
  partners: partnersService,
  teamMembers: teamMembersService,
  advertisements: advertisementsService,
  featureCategories: featureCategoriesService,
  sectionMedia: sectionMediaService,
  games: gamesService,
  pressReleases: pressReleasesService,
  pressKitFiles: pressKitFilesService,
  logs: logsService,
  migration: migrationService,
  sync: syncService,
  waitlist: waitlistService,
  emailTemplates: emailTemplatesService,
  emailLogs: emailLogsService,
  partnerApplications: partnerApplicationsService,
  legalDocuments: legalDocumentsService
};
