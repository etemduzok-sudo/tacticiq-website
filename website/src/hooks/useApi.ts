/**
 * useApi Hook
 * API çağrıları için custom React hook
 */

import { useState, useCallback } from 'react';
import { ApiError } from '@/services/apiService';
import { toast } from 'sonner';

interface UseApiOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * API çağrıları için custom hook
 * @param apiFunction - API servis fonksiyonu
 * @param options - Hook seçenekleri
 */
export function useApi<T = unknown>(
  apiFunction: (...args: unknown[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const {
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiFunction(...args);
        
        setData(result);
        
        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }
        
        return result;
      } catch (err: unknown) {
        const error = err as ErrorLike;
        const apiError: ApiError = {
          message: error.message || 'Bir hata oluştu',
          statusCode: (error as { statusCode?: number }).statusCode,
          details: (error as { details?: unknown }).details,
        };
        
        setError(apiError);
        
        if (showErrorToast) {
          toast.error(apiError.message);
        }
        
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, showErrorToast, showSuccessToast, successMessage]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * API çağrıları için mutation hook (POST, PUT, DELETE operations)
 */
export function useApiMutation<T = unknown, P = unknown>(
  apiFunction: (params: P) => Promise<T>,
  options: UseApiOptions = {}
) {
  return useApi<T>(apiFunction, options);
}

/**
 * API çağrıları için query hook (GET operations)
 */
export function useApiQuery<T = any>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions & { autoFetch?: boolean } = {}
) {
  const { autoFetch = false, ...restOptions } = options;
  const apiHook = useApi<T>(apiFunction, restOptions);

  // Auto fetch on mount
  if (autoFetch && !apiHook.data && !apiHook.loading) {
    apiHook.execute();
  }

  return apiHook;
}
