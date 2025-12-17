/**
 * Global type definitions for renderer process
 */

import type { AutoLabelAPI } from '../shared/types';

declare global {
  interface Window {
    autolabel: AutoLabelAPI;
  }
}

export {};

