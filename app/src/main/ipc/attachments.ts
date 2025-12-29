/**
 * Attachments IPC Handlers
 * Handle attachment-related operations
 */

import { ipcMain } from 'electron';
import * as attachmentsRepo from '../database/repositories/attachments';
import type { Attachment } from '../../shared/types';
import { logError, logDebug } from '../utils/logger';

/**
 * Register attachment IPC handlers
 */
export function registerAttachmentsHandlers(): void {
  // Get attachments for a specific sale
  ipcMain.handle(
    'attachments:getBySale',
    async (_event, saleId: string): Promise<Attachment[]> => {
      console.log('[IPC] attachments:getBySale called for:', saleId);
      logDebug('Getting attachments for sale', { saleId });

      try {
        const attachments = attachmentsRepo.getAttachmentsBySaleId(saleId);
        console.log(`[IPC] Found ${attachments.length} attachments for sale ${saleId}`);
        logDebug('Attachments retrieved', { 
          saleId,
          count: attachments.length,
        });
        return attachments;
      } catch (error) {
        console.error('[IPC] Failed to get attachments:', error);
        logError('Failed to get attachments', error, { saleId });
        return [];
      }
    }
  );
}

