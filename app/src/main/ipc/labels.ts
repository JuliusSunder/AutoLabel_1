/**
 * Labels IPC Handlers
 * Handle label preparation operations
 */

import { ipcMain } from 'electron';
import fs from 'fs';
import { prepareLabels } from '../labels/processor';
import { generatePDFThumbnail } from '../labels/pdf-thumbnail';
import type { PreparedLabel, FooterConfig } from '../../shared/types';
import { logError, logInfo, logDebug } from '../utils/logger';
import { getUserFriendlyError } from '../utils/error-messages';
import { canCreateLabels, incrementUsage, canCustomFooter } from '../license/license-manager';

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
      logInfo('Label preparation started', { 
        saleCount: params.saleIds.length,
        hasFooter: !!params.footerConfig,
      });

      try {
        // Check if custom footer is allowed
        if (params.footerConfig && !canCustomFooter()) {
          const error = new Error('Custom Footer ist nur in Premium-Plänen verfügbar. Bitte upgraden Sie Ihren Plan.');
          logError('Custom footer not allowed', error);
          throw error;
        }

        // Check usage limits before creating labels
        const labelCount = params.saleIds.length;
        const usageCheck = canCreateLabels(labelCount);
        
        if (!usageCheck.allowed) {
          const error = new Error(usageCheck.reason || 'Monatslimit erreicht');
          logError('Usage limit exceeded', error, { 
            labelCount,
            reason: usageCheck.reason,
          });
          throw error;
        }

        // Prepare labels
        const preparedLabels = await prepareLabels(
          params.saleIds,
          params.footerConfig
        );
        
        // Increment usage counter after successful preparation
        incrementUsage(preparedLabels.length);
        
        console.log(`[IPC] Prepared ${preparedLabels.length} labels`);
        logInfo('Label preparation completed', { 
          preparedCount: preparedLabels.length,
          saleCount: params.saleIds.length,
        });
        
        return preparedLabels;
      } catch (error) {
        console.error('[IPC] Label preparation failed:', error);
        logError('Label preparation failed', error, { 
          saleIds: params.saleIds,
          saleCount: params.saleIds.length,
        });
        
        const userFriendlyMessage = getUserFriendlyError(error);
        throw new Error(userFriendlyMessage);
      }
    }
  );

  // Generate thumbnail
  ipcMain.handle(
    'labels:getThumbnail',
    async (_event, filePath: string): Promise<string> => {
      console.log('[IPC] labels:getThumbnail called for:', filePath);
      logDebug('Generating thumbnail', { filePath });

      try {
        const thumbnail = await generatePDFThumbnail(filePath, 300);
        console.log('[IPC] Thumbnail generated successfully');
        logDebug('Thumbnail generated successfully', { filePath });
        return thumbnail;
      } catch (error) {
        console.error('[IPC] Failed to generate thumbnail:', error);
        logError('Failed to generate thumbnail', error, { filePath });
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
