/**
 * Labels IPC Handlers
 * Handle label preparation operations
 */

import { ipcMain } from 'electron';
import fs from 'fs';
import { prepareLabels } from '../labels/processor';
import { generatePDFThumbnail } from '../labels/pdf-thumbnail';
import type { PreparedLabel, FooterConfig } from '../../shared/types';

/**
 * Register labels IPC handlers
 */
export function registerLabelsHandlers(): void {
  // Prepare labels for selected sales
  ipcMain.handle(
    'labels:prepare',
    async (
      _event,
      params: { saleIds: string[]; footerConfig: FooterConfig }
    ): Promise<PreparedLabel[]> => {
      console.log('[IPC] labels:prepare called with:', params);

      try {
        const preparedLabels = await prepareLabels(
          params.saleIds,
          params.footerConfig
        );
        console.log(`[IPC] Prepared ${preparedLabels.length} labels`);
        return preparedLabels;
      } catch (error) {
        console.error('[IPC] Label preparation failed:', error);
        throw error;
      }
    }
  );

  // Generate thumbnail
  ipcMain.handle(
    'labels:getThumbnail',
    async (_event, filePath: string): Promise<string> => {
      console.log('[IPC] labels:getThumbnail called for:', filePath);

      try {
        const thumbnail = await generatePDFThumbnail(filePath, 300);
        console.log('[IPC] Thumbnail generated successfully');
        return thumbnail;
      } catch (error) {
        console.error('[IPC] Failed to generate thumbnail:', error);
        return generateErrorPlaceholder('Error loading file');
      }
    }
  );
}

/**
 * Generate error placeholder
 */
function generateErrorPlaceholder(message: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
    <rect width="200" height="300" fill="#f0f0f0"/>
    <text x="50%" y="50%" text-anchor="middle" fill="#999" font-family="Arial" font-size="14">${message}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
