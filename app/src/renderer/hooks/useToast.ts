/**
 * Custom Toast Hook
 * Wrapper around sonner for consistent toast notifications
 */

import { toast as sonnerToast } from 'sonner';

export interface ToastOptions {
  duration?: number;
  description?: string;
}

export const useToast = () => {
  return {
    success: (message: string, options?: ToastOptions) => {
      sonnerToast.success(message, {
        duration: options?.duration ?? 4000,
        description: options?.description,
      });
    },
    error: (message: string, options?: ToastOptions) => {
      sonnerToast.error(message, {
        duration: options?.duration ?? 4000,
        description: options?.description,
      });
    },
    info: (message: string, options?: ToastOptions) => {
      sonnerToast.info(message, {
        duration: options?.duration ?? 4000,
        description: options?.description,
      });
    },
    warning: (message: string, options?: ToastOptions) => {
      sonnerToast.warning(message, {
        duration: options?.duration ?? 4000,
        description: options?.description,
      });
    },
  };
};

// Export toast functions directly for convenience
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
    });
  },
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
    });
  },
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
    });
  },
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
    });
  },
};

