/**
 * Admin Service
 * Admin panel için backend API çağrıları
 */

import { apiService, ApiResponse } from './apiService';
import { API_ENDPOINTS } from '@/config/api.config';
import {
  AdminStats,
  User,
  Content,
  Activity,
  LogEntry,
  Advertisement,
  AdSettings,
  SiteSettings,
} from '@/contexts/AdminDataContext';

export class AdminService {
  // ==================== STATS ====================
  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<AdminStats> {
    const response = await apiService.get<AdminStats>(API_ENDPOINTS.STATS.DASHBOARD);
    return response.data!;
  }

  /**
   * Get visitor statistics
   */
  async getVisitorStats(period?: string): Promise<any> {
    const response = await apiService.get(API_ENDPOINTS.STATS.VISITORS, {
      params: { period },
    });
    return response.data;
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(period?: string): Promise<any> {
    const response = await apiService.get(API_ENDPOINTS.STATS.REVENUE, {
      params: { period },
    });
    return response.data;
  }

  // ==================== USERS ====================
  /**
   * Get all users
   */
  async getUsers(): Promise<User[]> {
    const response = await apiService.get<User[]>(API_ENDPOINTS.USERS.LIST);
    return response.data!;
  }

  /**
   * Create new user
   */
  async createUser(user: Omit<User, 'id' | 'joinDate'>): Promise<User> {
    const response = await apiService.post<User>(API_ENDPOINTS.USERS.BASE, user);
    return response.data!;
  }

  /**
   * Update user
   */
  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const url = API_ENDPOINTS.USERS.UPDATE.replace(':id', id);
    const response = await apiService.put<User>(url, user);
    return response.data!;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const url = API_ENDPOINTS.USERS.DELETE.replace(':id', id);
    await apiService.delete(url);
  }

  // ==================== CONTENT ====================
  /**
   * Get all content
   */
  async getContent(): Promise<Content[]> {
    const response = await apiService.get<Content[]>(API_ENDPOINTS.CONTENT.LIST);
    return response.data!;
  }

  /**
   * Create new content
   */
  async createContent(content: Omit<Content, 'id' | 'date'>): Promise<Content> {
    const response = await apiService.post<Content>(API_ENDPOINTS.CONTENT.CREATE, content);
    return response.data!;
  }

  /**
   * Update content
   */
  async updateContent(id: string, content: Partial<Content>): Promise<Content> {
    const url = API_ENDPOINTS.CONTENT.UPDATE.replace(':id', id);
    const response = await apiService.put<Content>(url, content);
    return response.data!;
  }

  /**
   * Delete content
   */
  async deleteContent(id: string): Promise<void> {
    const url = API_ENDPOINTS.CONTENT.DELETE.replace(':id', id);
    await apiService.delete(url);
  }

  /**
   * Publish content
   */
  async publishContent(id: string): Promise<Content> {
    const url = API_ENDPOINTS.CONTENT.PUBLISH.replace(':id', id);
    const response = await apiService.post<Content>(url);
    return response.data!;
  }

  // ==================== ADVERTISEMENTS ====================
  /**
   * Get all advertisements
   */
  async getAdvertisements(): Promise<Advertisement[]> {
    const response = await apiService.get<Advertisement[]>(API_ENDPOINTS.ADS.LIST);
    return response.data!;
  }

  /**
   * Create advertisement
   */
  async createAdvertisement(ad: Omit<Advertisement, 'id' | 'createdDate'>): Promise<Advertisement> {
    const response = await apiService.post<Advertisement>(API_ENDPOINTS.ADS.CREATE, ad);
    return response.data!;
  }

  /**
   * Update advertisement
   */
  async updateAdvertisement(id: string, ad: Partial<Advertisement>): Promise<Advertisement> {
    const url = API_ENDPOINTS.ADS.UPDATE.replace(':id', id);
    const response = await apiService.put<Advertisement>(url, ad);
    return response.data!;
  }

  /**
   * Delete advertisement
   */
  async deleteAdvertisement(id: string): Promise<void> {
    const url = API_ENDPOINTS.ADS.DELETE.replace(':id', id);
    await apiService.delete(url);
  }

  /**
   * Increment advertisement view count
   */
  async incrementAdView(id: string): Promise<void> {
    const url = API_ENDPOINTS.ADS.INCREMENT_VIEW.replace(':id', id);
    await apiService.post(url);
  }

  /**
   * Get advertisement settings
   */
  async getAdSettings(): Promise<AdSettings> {
    const response = await apiService.get<AdSettings>(API_ENDPOINTS.ADS.SETTINGS);
    return response.data!;
  }

  /**
   * Update advertisement settings
   */
  async updateAdSettings(settings: Partial<AdSettings>): Promise<AdSettings> {
    const response = await apiService.put<AdSettings>(API_ENDPOINTS.ADS.SETTINGS, settings);
    return response.data!;
  }

  // ==================== SETTINGS ====================
  /**
   * Get site settings
   */
  async getSettings(): Promise<SiteSettings> {
    const response = await apiService.get<SiteSettings>(API_ENDPOINTS.SETTINGS.GET);
    return response.data!;
  }

  /**
   * Update site settings
   */
  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const response = await apiService.put<SiteSettings>(API_ENDPOINTS.SETTINGS.UPDATE, settings);
    return response.data!;
  }

  // ==================== ACTIVITIES ====================
  /**
   * Get activities
   */
  async getActivities(limit?: number): Promise<Activity[]> {
    const response = await apiService.get<Activity[]>(API_ENDPOINTS.LOGS.LIST, {
      params: { limit, type: 'activity' },
    });
    return response.data!;
  }

  /**
   * Create activity log
   */
  async createActivity(activity: Omit<Activity, 'id' | 'time'>): Promise<Activity> {
    const response = await apiService.post<Activity>(API_ENDPOINTS.LOGS.CREATE, {
      ...activity,
      logType: 'activity',
    });
    return response.data!;
  }

  // ==================== LOGS ====================
  /**
   * Get system logs
   */
  async getLogs(type?: string): Promise<LogEntry[]> {
    const response = await apiService.get<LogEntry[]>(API_ENDPOINTS.LOGS.LIST, {
      params: { type, logType: 'system' },
    });
    return response.data!;
  }

  /**
   * Create log entry
   */
  async createLog(log: Omit<LogEntry, 'id' | 'time'>): Promise<LogEntry> {
    const response = await apiService.post<LogEntry>(API_ENDPOINTS.LOGS.CREATE, {
      ...log,
      logType: 'system',
    });
    return response.data!;
  }

  // ==================== BLOG ====================
  /**
   * Get all blog posts
   */
  async getBlogPosts(): Promise<any[]> {
    const response = await apiService.get<any[]>(API_ENDPOINTS.BLOG.LIST);
    return response.data!;
  }

  /**
   * Get single blog post
   */
  async getBlogPost(id: string): Promise<any> {
    const url = API_ENDPOINTS.BLOG.GET.replace(':id', id);
    const response = await apiService.get(url);
    return response.data;
  }

  /**
   * Create blog post
   */
  async createBlogPost(post: any): Promise<any> {
    const response = await apiService.post(API_ENDPOINTS.BLOG.CREATE, post);
    return response.data;
  }

  /**
   * Update blog post
   */
  async updateBlogPost(id: string, post: any): Promise<any> {
    const url = API_ENDPOINTS.BLOG.UPDATE.replace(':id', id);
    const response = await apiService.put(url, post);
    return response.data;
  }

  /**
   * Delete blog post
   */
  async deleteBlogPost(id: string): Promise<void> {
    const url = API_ENDPOINTS.BLOG.DELETE.replace(':id', id);
    await apiService.delete(url);
  }

  // ==================== FILE UPLOAD ====================
  /**
   * Upload file (image, video, etc.)
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string }> {
    const response = await apiService.uploadFile<{ url: string }>(
      '/upload',
      file,
      (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    );
    return response.data!;
  }
}

// Export singleton instance
export const adminService = new AdminService();
export default adminService;
