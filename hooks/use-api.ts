import { useState, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';
import { errorHandler, AppError } from '@/lib/utils/error-handler';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  showToast?: boolean;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
      
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const handledError = errorHandler.handle(error as Error);
      setState(prev => ({ ...prev, loading: false, error: handledError }));
      
      logger.error('API call failed', { error: handledError.message }, 'useApi');
      options.onError?.(handledError);
      
      throw handledError;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}