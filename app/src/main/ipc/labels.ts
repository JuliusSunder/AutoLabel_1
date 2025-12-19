/**
 * Labels IPC Handlers
 * Handle label preparation operations
 */

import { ipcMain } from 'electron';
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

  // Generate PDF thumbnail
  ipcMain.handle(
    'labels:getThumbnail',
    async (_event, pdfPath: string): Promise<string> => {
      console.log('[IPC] labels:getThumbnail called for:', pdfPath);

      try {
        const thumbnail = await generatePDFThumbnail(pdfPath, 200);
        console.log('[IPC] Thumbnail generated successfully');
        return thumbnail;
      } catch (error) {
        console.error('[IPC] Failed to generate thumbnail:', error);
        // Return placeholder on error
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMzAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5QREY8L3RleHQ+PC9zdmc+';
      }
    }
  );
}
