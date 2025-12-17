/**
 * Hook for accessing the AutoLabel IPC API
 * Provides typed access to window.autolabel
 */

import type { AutoLabelAPI } from '../../shared/types';

/**
 * Get the AutoLabel API
 * This is a simple wrapper that ensures the API is available
 */
export function useAutolabel(): AutoLabelAPI {
  if (!window.autolabel) {
    throw new Error('AutoLabel API not available. Make sure preload script is loaded.');
  }
  return window.autolabel;
}
