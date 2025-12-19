/**
 * Attachments IPC Handlers
 * Handle attachment-related operations
 */

import { ipcMain } from 'electron';
import * as attachmentsRepo from '../database/repositories/attachments';
import type { Attachment } from '../../shared/types';

/**
 * Register attachment IPC handlers
 */
export function registerAttachmentsHandlers(): void {
  // Get attachments for a specific sale
  ipcMain.handle(
    'attachments:getBySale',
    async (_event, saleId: string): Promise<Attachment[]> => {
      console.log('[IPC] attachments:getBySale called for:', saleId);

      try {
        const attachments = attachmentsRepo.getAttachmentsBySaleId(saleId);
        console.log(`[IPC] Found ${attachments.length} attachments for sale ${saleId}`);
        return attachments;
      } catch (error) {
        console.error('[IPC] Failed to get attachments:', error);
        return [];
      }
    }
  );
}

