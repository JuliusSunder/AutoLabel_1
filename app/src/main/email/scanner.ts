/**
 * Email Scanner
 * Orchestrates the email scanning process
 */

import { ImapClient } from './imap-client';
import { processEmail } from './providers/generic';
import { saveAttachments } from './attachment-handler';
import { detectShippingCompanyFromPDF, isShippingLabelPDF } from './pdf-analyzer';
import { parseVintedEmail, isVintedEmail, hasVintedShippingLabel } from './parsers/vinted-parser';
import * as salesRepo from '../database/repositories/sales';
import * as attachmentsRepo from '../database/repositories/attachments';
import { generateId, getDatabase } from '../database/db';
import { loadConfig, updateConfig } from '../config';
import fs from 'node:fs';
import path from 'node:path';
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
          // First, try to save attachments to see if there are any valid ones
          const saleId = generateId();
          const savedAttachments = saveAttachments(email, saleId);

          // Only create sale if we have valid attachments
          if (savedAttachments.length === 0) {
            console.log(`[Scanner] Skipping email ${email.messageId} - no valid attachments`);
            continue;
          }

          // For now, accept all attachments (PDF parsing disabled due to library issues)
          // TODO: Re-enable PDF validation once pdf-parse compatibility is fixed
          const validAttachments = savedAttachments;
          let shippingCompany = parsedSale.shippingCompany;
          
          console.log(`[Scanner] Sale has ${validAttachments.length} attachments`);
          console.log(`[Scanner] Email-detected shipping company: ${shippingCompany || 'None'}`);

          // Create sale record with PDF-detected shipping company (if available)
          const sale = salesRepo.createSale({
            emailId: parsedSale.emailId,
            date: parsedSale.date,
            platform: parsedSale.platform,
            shippingCompany: shippingCompany,
            productNumber: parsedSale.productNumber,
            itemTitle: parsedSale.itemTitle,
            buyerRef: parsedSale.buyerRef,
            metadata: parsedSale.metadata,
          });

          console.log(
            `[Scanner] Created sale: ${sale.id} | Platform: ${sale.platform || 'None'} | Shipping: ${sale.shippingCompany || 'None'}`
          );

          // Create attachment records (only for valid attachments)
          for (const attachment of validAttachments) {
            attachmentsRepo.createAttachment({
              saleId: sale.id,
              type: attachment.type,
              localPath: attachment.localPath,
              sourceEmailId: email.messageId,
              originalFilename: attachment.originalFilename,
            });
          }

          console.log(
            `[Scanner] Saved ${validAttachments.length} valid attachments for sale ${sale.id}`
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

/**
 * Refresh Vinted Sales - Complete database reset and rescan
 * Optimized specifically for Vinted emails
 */
export async function refreshVintedSales(): Promise<ScanResult> {
  console.log('\n========================================');
  console.log('[Vinted Scanner] Starting Vinted refresh...');
  console.log('========================================\n');
  
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
    // STEP 1: Clear database completely
    console.log('[Vinted Scanner] Clearing existing database...');
    const db = getDatabase();
    db.exec('DELETE FROM sales');
    db.exec('DELETE FROM attachments');
    db.exec('DELETE FROM prepared_labels');
    db.exec('DELETE FROM print_jobs');
    db.exec('DELETE FROM print_job_items');
    console.log('[Vinted Scanner] ✅ Database cleared\n');

    // STEP 2: Connect to IMAP
    const client = new ImapClient(config.imap);
    console.log('[Vinted Scanner] Connecting to IMAP server...');
    await client.connect();
    await client.openMailbox('INBOX');

    // STEP 3: Search for Vinted emails only
    const scanDays = config.scanDays || 30;
    console.log(`[Vinted Scanner] Searching for Vinted emails from last ${scanDays} days...\n`);
    
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - scanDays);
    
    const uids = await client.searchEmails([
      ['SINCE', sinceDate],
      ['FROM', 'vinted']
    ]);
    
    scannedCount = uids.length;
    console.log(`[Vinted Scanner] Found ${scannedCount} Vinted emails\n`);

    if (uids.length === 0) {
      client.disconnect();
      console.log('[Vinted Scanner] No Vinted emails found');
      return {
        scannedCount: 0,
        newSales: 0,
      };
    }

    // STEP 4: Fetch and process emails
    console.log('[Vinted Scanner] Fetching email contents...\n');
    const emails = await client.fetchMessages(uids);

    for (const email of emails) {
      try {
        // Check if it's a Vinted email with PDF (shipping label)
        if (!isVintedEmail(email)) {
          console.log(`[Vinted Scanner] ⚠️  Skipping non-Vinted email: ${email.subject.substring(0, 40)}...`);
          continue;
        }

        if (!hasVintedShippingLabel(email)) {
          console.log(`[Vinted Scanner] ⏭️  Skipping Vinted email without PDF: ${email.subject.substring(0, 40)}...`);
          continue;
        }

        // Parse Vinted email for carrier and item info
        const result = parseVintedEmail(email);

        // Save attachments first
        const saleId = generateId();
        const savedAttachments = saveAttachments(email, saleId);

        if (savedAttachments.length === 0) {
          console.log(`[Vinted Scanner] ⚠️  No valid attachments saved for: ${email.subject.substring(0, 40)}...`);
          continue;
        }

        // Create sale record
        const sale = salesRepo.createSale({
          emailId: email.messageId,
          date: email.date.toISOString().split('T')[0],
          platform: 'Vinted/Kleiderkreisel',
          shippingCompany: result.carrier || undefined,
          itemTitle: result.itemTitle,
          metadata: {
            from: email.from,
            subject: email.subject,
            receivedDate: email.date.toISOString(),
            instructions: result.instructions,
          },
        });

        // Create attachment records
        for (const attachment of savedAttachments) {
          attachmentsRepo.createAttachment({
            saleId: sale.id,
            type: attachment.type,
            localPath: attachment.localPath,
            sourceEmailId: email.messageId,
            originalFilename: attachment.originalFilename,
          });
        }

        newSales++;
        console.log(`[Vinted Scanner] ✅ Created sale: ${sale.id}`);
        console.log(`   Item: ${result.itemTitle}`);
        console.log(`   Carrier: ${result.carrier || 'Unknown'}`);
        console.log(`   Attachments: ${savedAttachments.length}\n`);

      } catch (error) {
        console.error('[Vinted Scanner] ❌ Error processing email:', error);
        errors.push(`Failed to process email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update last scan date
    updateConfig({ lastScanDate: new Date().toISOString() });

    // Disconnect
    client.disconnect();

    console.log('\n========================================');
    console.log('[Vinted Scanner] SCAN COMPLETE');
    console.log(`  Emails checked: ${scannedCount}`);
    console.log(`  Sales imported: ${newSales}`);
    console.log(`  Errors: ${errors.length}`);
    console.log('========================================\n');

    return {
      scannedCount,
      newSales,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('[Vinted Scanner] ❌ Scan failed:', error);
    return {
      scannedCount,
      newSales,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}
