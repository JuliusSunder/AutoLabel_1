/**
 * Email Scanner
 * Orchestrates the email scanning process
 */

import { ImapClient } from './imap-client';
import { processEmail } from './providers/generic';
import { saveAttachments } from './attachment-handler';
import * as salesRepo from '../database/repositories/sales';
import * as attachmentsRepo from '../database/repositories/attachments';
import { generateId } from '../database/db';
import { loadConfig, updateConfig } from '../config';
import type { ScanResult } from '../../shared/types';

/**
 * Scan mailbox for new sales
 */
export async function scanMailbox(): Promise<ScanResult> {
  console.log('[Scanner] Starting email scan...');

  const config = loadConfig();

  // Check if IMAP is configured
  if (!config.imap) {
    return {
      scannedCount: 0,
      newSales: 0,
      errors: ['IMAP not configured. Please set up your email credentials first.'],
    };
  }

  const errors: string[] = [];
  let scannedCount = 0;
  let newSales = 0;

  try {
    // Create IMAP client
    const client = new ImapClient(config.imap);

    // Connect to IMAP server
    console.log('[Scanner] Connecting to IMAP server...');
    await client.connect();

    // Open INBOX
    await client.openMailbox('INBOX');

    // Search for recent emails (last N days)
    const scanDays = config.scanDays || 30;
    console.log(`[Scanner] Searching for emails from last ${scanDays} days...`);
    const uids = await client.searchRecentEmails(scanDays);
    scannedCount = uids.length;

    console.log(`[Scanner] Found ${scannedCount} emails to check`);

    if (uids.length === 0) {
      client.disconnect();
      return {
        scannedCount: 0,
        newSales: 0,
      };
    }

    // Fetch emails
    console.log('[Scanner] Fetching email contents...');
    const emails = await client.fetchMessages(uids);

    // Process each email
    for (const email of emails) {
      try {
        // Check if we've already processed this email
        const existing = salesRepo.getSaleByEmailId(email.messageId);
        if (existing) {
          console.log(`[Scanner] Skipping already processed email: ${email.messageId}`);
          continue;
        }

        // Try to extract sale from email
        const parsedSale = processEmail(email);

        if (parsedSale) {
          // Create sale record
          const saleId = generateId();
          const sale = salesRepo.createSale({
            emailId: parsedSale.emailId,
            date: parsedSale.date,
            platform: parsedSale.platform,
            productNumber: parsedSale.productNumber,
            itemTitle: parsedSale.itemTitle,
            buyerRef: parsedSale.buyerRef,
            metadata: parsedSale.metadata,
          });

          console.log(`[Scanner] Created sale: ${sale.id}`);

          // Save attachments
          const savedAttachments = saveAttachments(email, sale.id);

          // Create attachment records
          for (const attachment of savedAttachments) {
            attachmentsRepo.createAttachment({
              saleId: sale.id,
              type: attachment.type,
              localPath: attachment.localPath,
              sourceEmailId: email.messageId,
            });
          }

          console.log(
            `[Scanner] Saved ${savedAttachments.length} attachments for sale ${sale.id}`
          );

          newSales++;
        }
      } catch (error) {
        console.error('[Scanner] Error processing email:', error);
        errors.push(`Failed to process email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update last scan date
    updateConfig({ lastScanDate: new Date().toISOString() });

    // Disconnect
    client.disconnect();

    console.log(`[Scanner] Scan complete. Found ${newSales} new sales.`);

    return {
      scannedCount,
      newSales,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('[Scanner] Scan failed:', error);
    return {
      scannedCount,
      newSales,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}
