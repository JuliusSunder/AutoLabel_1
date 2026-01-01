/**
 * Labels IPC Handlers
 * Handle label preparation operations
 */

import { ipcMain } from 'electron';
import { prepareLabels } from '../labels/processor';
import { generatePDFThumbnail } from '../labels/pdf-thumbnail';
import type { PreparedLabel, FooterConfig } from '../../shared/types';
import { logError, logInfo, logDebug } from '../utils/logger';
import { getUserFriendlyError } from '../utils/error-messages';
import { getCachedUserInfo } from '../auth/auth-manager';

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
        // Get user's current plan from cache
        const { subscription } = getCachedUserInfo();
        const plan = subscription?.plan || 'free';

        // Check if custom footer is allowed - if not, ignore footer config
        let footerConfig = params.footerConfig;
        if (params.footerConfig && plan === 'free') {
          console.log('[IPC] Custom footer not allowed in free plan, ignoring footer config');
          logInfo('Custom footer not allowed, preparing labels without footer', {
            plan: 'free',
          });
          footerConfig = undefined; // Ignore footer config for free plan
        }

        // NOTE: Label count validation is now done at print time, not prepare time
        // This allows users to prepare labels without consuming their quota
        // The quota is only consumed when actually printing

        // Prepare labels (with or without footer depending on plan)
        const preparedLabels = await prepareLabels(
          params.saleIds,
          footerConfig
        );
        
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
