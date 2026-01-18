/**
 * Admin Supabase Service
 * Website admin panel verilerini Supabase'de yönetir
 * localStorage fallback ile çalışır (internet yoksa)
 */

import { supabase } from '../config/supabase';

// =====================================================
// Types
// =====================================================

export interface Partner {
  id: string;
  name: string;
  logo: string;
  link: string;
  category: string;
  description: string;
  enabled: boolean;
  featured: boolean;
  sort_order: number;
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

export default {
  config: configService,
  partners: partnersService,
  teamMembers: teamMembersService,
  advertisements: advertisementsService,
  logs: logsService,
  migration: migrationService
};
