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
  console.log(`[Processor] Preparing labels for ${saleIds.length} sales`);

  const preparedLabels: PreparedLabel[] = [];
  const errors: string[] = [];

  for (const saleId of saleIds) {
    try {
      // Get sale data
      const sale = salesRepo.getSaleById(saleId);
      if (!sale) {
        console.error(`[Processor] Sale not found: ${saleId}`);
        errors.push(`Sale not found: ${saleId}`);
        continue;
      }

      // Get attachments
      const attachments = attachmentsRepo.getAttachmentsBySaleId(saleId);
      if (attachments.length === 0) {
        console.error(`[Processor] No attachments for sale: ${saleId}`);
        errors.push(`No attachments for sale: ${saleId}`);
        continue;
      }

      // Select only ONE attachment per sale (prefer PDF over images)
      const selectedAttachment = 
        attachments.find(att => att.type === 'pdf') || attachments[0];
      
      console.log(`[Processor] Processing ${attachments.length} attachment(s) found, using: ${selectedAttachment.id}`);

      try {
        console.log(`[Processor] Processing attachment: ${selectedAttachment.id}`);

        // Step 1: Normalize to 100×150mm
        const normalized = await normalizeLabel(selectedAttachment.localPath, {
          shippingCompany: sale.shippingCompany,
          platform: sale.platform,
          saleId: sale.id,
        });

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

        console.log(`[Processor] Prepared label: ${preparedLabel.id}`);
      } catch (error) {
        console.error(
          `[Processor] Error processing attachment ${selectedAttachment.id}:`,
          error
        );
        errors.push(
          `Failed to process attachment ${selectedAttachment.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    } catch (error) {
      console.error(`[Processor] Error processing sale ${saleId}:`, error);
      errors.push(
        `Failed to process sale ${saleId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  if (errors.length > 0) {
    console.warn('[Processor] Completed with errors:', errors);
  }

  console.log(`[Processor] Prepared ${preparedLabels.length} labels`);

  return preparedLabels;
}

