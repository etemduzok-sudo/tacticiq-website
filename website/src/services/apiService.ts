/**
 * API Service
 * Axios tabanlı HTTP client servisi
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, API_ERROR_MESSAGES } from '@/config/api.config';

// Response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

// Error type
export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private retryCount: number = 0;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Auth token ekleme
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Language header ekleme
        const language = localStorage.getItem('selectedLanguage') || 'en';
        config.headers['Accept-Language'] = language;

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.retryCount = 0; // Reset retry count on success
        return response;
      },
      async (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Set auth token to storage
   */
  public setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  /**
   * Remove auth token from storage
   */
  public removeAuthToken(): void {
    localStorage.removeItem('authToken');
  }

  /**
   * Handle API errors
   */
  private async handleError(error: AxiosError): Promise<any> {
    const response = error.response;

    // Network error
    if (!response) {
      return Promise.reject({
        message: API_ERROR_MESSAGES.NETWORK_ERROR,
        statusCode: 0,
      } as ApiError);
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - Token expired
        this.removeAuthToken();
        window.location.href = '/'; // Redirect to home/login
        return Promise.reject({
          message: API_ERROR_MESSAGES.UNAUTHORIZED,
          statusCode: 401,
        } as ApiError);

      case 403:
        return Promise.reject({
          message: API_ERROR_MESSAGES.FORBIDDEN,
          statusCode: 403,
        } as ApiError);

      case 404:
        return Promise.reject({
          message: API_ERROR_MESSAGES.NOT_FOUND,
          statusCode: 404,
        } as ApiError);

      case 422:
        return Promise.reject({
          message: API_ERROR_MESSAGES.VALIDATION_ERROR,
          statusCode: 422,
          details: response.data,
        } as ApiError);

      case 500:
      case 502:
      case 503:
        // Server error - Retry logic
        if (this.retryCount < API_CONFIG.RETRY_COUNT) {
          this.retryCount++;
          await this.delay(API_CONFIG.RETRY_DELAY * this.retryCount);
          return this.axiosInstance.request(error.config!);
        }
        return Promise.reject({
          message: API_ERROR_MESSAGES.SERVER_ERROR,
          statusCode: response.status,
        } as ApiError);

      default:
        return Promise.reject({
          message: (response.data as any)?.message || API_ERROR_MESSAGES.SERVER_ERROR,
          statusCode: response.status,
          details: response.data,
        } as ApiError);
    }
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST request
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * PUT request
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * PATCH request
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.patch(url, data, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload file
   */
  public async uploadFile<T = any>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response: AxiosResponse<T> = await this.axiosInstance.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
