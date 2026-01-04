/**
 * Label Processor
 * Main orchestrator for label preparation pipeline
 */

import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeLabel } from './normalizer';
import { addFooter } from './footer-renderer';
import { registerProfile } from './profiles/base';
import { genericProfile } from './profiles/generic';
import { vintedProfile } from './profiles/vinted';
import * as salesRepo from '../database/repositories/sales';
import * as attachmentsRepo from '../database/repositories/attachments';
import * as labelsRepo from '../database/repositories/labels';
import type { FooterConfig, PreparedLabel } from '../../shared/types';
import { TARGET_SIZE_MM, TARGET_DPI } from './utils';
import { logToRenderer, warnToRenderer, errorToRenderer } from '../utils/renderer-logger';

// Register profiles on module load
// Order matters: Vinted profile is checked first, generic is fallback
registerProfile(vintedProfile);
registerProfile(genericProfile);

/**
 * Get prepared labels directory
 */
function getPreparedDir(): string {
  const userDataPath = app.getPath('userData');
  const preparedPath = path.join(userDataPath, 'prepared');

  if (!fs.existsSync(preparedPath)) {
    fs.mkdirSync(preparedPath, { recursive: true });
  }

  return preparedPath;
}

/**
 * Prepare labels for selected sales
 */
export async function prepareLabels(
  saleIds: string[],
  footerConfig?: FooterConfig
): Promise<PreparedLabel[]> {
  logToRenderer(`[Processor] 🚀 Starting label preparation for ${saleIds.length} sale(s)`);

  const preparedLabels: PreparedLabel[] = [];
  const errors: string[] = [];

  for (const saleId of saleIds) {
    try {
      logToRenderer(`[Processor] 📦 Processing sale: ${saleId}`);
      
      // Get sale data
      const sale = salesRepo.getSaleById(saleId);
      if (!sale) {
        errorToRenderer(`[Processor] ❌ Sale not found: ${saleId}`);
        errors.push(`Sale not found: ${saleId}`);
        continue;
      }
      
      logToRenderer(`[Processor] 📋 Sale info:`);
      logToRenderer(`   - Sale ID: ${sale.id}`);
      logToRenderer(`   - Platform: ${sale.platform || 'None'}`);
      logToRenderer(`   - Shipping Company: ${sale.shippingCompany || 'None (will attempt detection)'}`);

      // Get attachments
      const attachments = attachmentsRepo.getAttachmentsBySaleId(saleId);
      if (attachments.length === 0) {
        errorToRenderer(`[Processor] ❌ No attachments for sale: ${saleId}`);
        errors.push(`No attachments for sale: ${saleId}`);
        continue;
      }

      // Select only ONE attachment per sale (prefer PDF over images)
      const selectedAttachment = 
        attachments.find(att => att.type === 'pdf') || attachments[0];
      
      logToRenderer(`[Processor] 📎 Selected attachment: ${selectedAttachment.type.toUpperCase()}`);
      logToRenderer(`   - Found ${attachments.length} attachment(s), using: ${selectedAttachment.id}`);
      logToRenderer(`   - Path: ${selectedAttachment.localPath}`);

      try {
        logToRenderer(`[Processor] 🔄 Processing attachment: ${selectedAttachment.id}`);

        // Step 1: Normalize to 100×150mm
        const normalized = await normalizeLabel(selectedAttachment.localPath, {
          shippingCompany: sale.shippingCompany,
          platform: sale.platform,
          saleId: sale.id,
        });

        // If shipping company was detected during normalization, update the sale
        if (normalized.detectedShippingCompany && !sale.shippingCompany) {
          logToRenderer(`[Processor] 🚚 Detected shipping company during normalization: ${normalized.detectedShippingCompany}`);
          logToRenderer(`[Processor] 💾 Updating sale ${sale.id} with shipping company...`);
          salesRepo.updateSale(sale.id, {
            shippingCompany: normalized.detectedShippingCompany,
          });
          // Update local sale object for footer rendering
          sale.shippingCompany = normalized.detectedShippingCompany;
          logToRenderer(`[Processor] ✅ Sale updated successfully with shipping company: ${normalized.detectedShippingCompany}`);
        } else if (sale.shippingCompany) {
          logToRenderer(`[Processor] ℹ️  Sale already has shipping company: ${sale.shippingCompany}`);
        } else {
          logToRenderer(`[Processor] ⚠️  No shipping company detected for this sale`);
        }

        // Step 2: Add footer (only if footerConfig is provided)
        // Keep format as-is for best quality
        const normalizedExt = path.extname(normalized.outputPath).toLowerCase();
        const finalFilename = `label_${Date.now()}_${saleId}${normalizedExt}`;
        const finalPath = path.join(getPreparedDir(), finalFilename);

        if (footerConfig) {
          // Add footer if config is provided
          await addFooter(
            normalized.outputPath,
            finalPath,
            sale,
            footerConfig
          );

          // Clean up temp file
          if (fs.existsSync(normalized.outputPath)) {
            fs.unlinkSync(normalized.outputPath);
          }
        } else {
          // No footer - just copy/move the normalized file
          console.log('[Processor] No footer config, using label without footer');
          fs.copyFileSync(normalized.outputPath, finalPath);
          
          // Clean up temp file
          if (fs.existsSync(normalized.outputPath)) {
            fs.unlinkSync(normalized.outputPath);
          }
        }

        // Step 3: Save to database
        const preparedLabel = labelsRepo.createPreparedLabel({
          saleId: sale.id,
          profileId: normalized.profileId,
          outputPath: finalPath,
          sizeMm: { width: TARGET_SIZE_MM.width, height: TARGET_SIZE_MM.height },
          dpi: TARGET_DPI,
          footerApplied: !!footerConfig, // Only true if footer was actually added
          footerConfig: footerConfig || undefined,
        });

        preparedLabels.push(preparedLabel);

        logToRenderer(`[Processor] ✅ Successfully prepared label: ${preparedLabel.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errorToRenderer(`[Processor] ❌ Error processing attachment ${selectedAttachment.id}:`, errorMessage);
        errorToRenderer(`[Processor] Full error:`, error);
        
        // Provide more helpful error messages
        let userFriendlyMessage = errorMessage;
        if (errorMessage.includes('ImageMagick nicht gefunden')) {
          userFriendlyMessage = `ImageMagick fehlt - Hermes/GLS/DHL Labels können nicht verarbeitet werden. Bitte kontaktieren Sie den Support.`;
        } else if (errorMessage.includes('magick')) {
          userFriendlyMessage = `ImageMagick-Fehler: ${errorMessage}`;
        }
        
        errors.push(
          `Attachment ${selectedAttachment.id}: ${userFriendlyMessage}`
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errorToRenderer(`[Processor] ❌ Error processing sale ${saleId}:`, errorMessage);
      errorToRenderer(`[Processor] Full error:`, error);
      errors.push(
        `Sale ${saleId}: ${errorMessage}`
      );
    }
  }

  if (errors.length > 0) {
    errorToRenderer(`[Processor] ⚠️ Completed with ${errors.length} error(s):`);
    errorToRenderer('[Processor] Error details:', errors);
    errorToRenderer('[Processor] Error summary:', {
      totalSales: saleIds.length,
      successfulLabels: preparedLabels.length,
      failedSales: errors.length,
    });
  }

  logToRenderer(`[Processor] ✅ Prepared ${preparedLabels.length} of ${saleIds.length} label(s)`);

  return preparedLabels;
}

