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
import { getActiveAccounts, getEmailAccount } from '../database/repositories/email-accounts';
import fs from 'node:fs';
import path from 'node:path';
import type { ScanResult, EmailAccount } from '../../shared/types';

/**
 * Scan a single email account
 */
async function scanSingleAccount(account: EmailAccount, scanDays: number): Promise<{
  scannedCount: number;
  newSales: number;
  errors: string[];
}> {
  console.log(`[Scanner] Scanning account: ${account.name} (${account.username})`);

  const errors: string[] = [];
  let scannedCount = 0;
  let newSales = 0;

  try {
    // Create IMAP client
    const client = new ImapClient({
      host: account.host,
      port: account.port,
      username: account.username,
      password: account.password,
      tls: account.tls,
    });

    // Connect to IMAP server
    console.log(`[Scanner] Connecting to ${account.host}...`);
    await client.connect();

    // Open INBOX
    await client.openMailbox('INBOX');

    // Search for recent emails
    console.log(`[Scanner] Searching for emails from last ${scanDays} days...`);
    const uids = await client.searchRecentEmails(scanDays);
    scannedCount = uids.length;

    console.log(`[Scanner] Found ${scannedCount} emails to check in ${account.name}`);

    if (uids.length === 0) {
      await client.disconnect();
      return { scannedCount: 0, newSales: 0, errors: [] };
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

          const validAttachments = savedAttachments;
          let shippingCompany = parsedSale.shippingCompany;
          
          console.log(`[Scanner] Sale has ${validAttachments.length} attachments`);
          console.log(`[Scanner] Email-detected shipping company: ${shippingCompany || 'None'}`);

          // Create sale record with account_id
          const sale = salesRepo.createSale({
            emailId: parsedSale.emailId,
            date: parsedSale.date,
            platform: parsedSale.platform,
            shippingCompany: shippingCompany,
            productNumber: parsedSale.productNumber,
            itemTitle: parsedSale.itemTitle,
            buyerRef: parsedSale.buyerRef,
            metadata: parsedSale.metadata,
            accountId: account.id, // Link to account
          });

          console.log(
            `[Scanner] Created sale: ${sale.id} | Account: ${account.name} | Platform: ${sale.platform || 'None'} | Shipping: ${sale.shippingCompany || 'None'}`
          );

          // Create attachment records
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

    // Disconnect
    await client.disconnect();

    console.log(`[Scanner] Account ${account.name} scan complete. Found ${newSales} new sales.`);

    return { scannedCount, newSales, errors };
  } catch (error) {
    console.error(`[Scanner] Account ${account.name} scan failed:`, error);
    return {
      scannedCount: 0,
      newSales: 0,
      errors: [`${account.name}: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Scan mailbox for new sales (multi-account support)
 * @param accountId - Optional account ID to scan only one account
 */
export async function scanMailbox(accountId?: string): Promise<ScanResult> {
  console.log('[Scanner] Starting email scan...');

  const config = loadConfig();
  const scanDays = config.scanDays || 30;

  let accounts: EmailAccount[];

  if (accountId) {
    // Scan specific account
    const account = getEmailAccount(accountId, true); // decrypt password
    if (!account) {
      return {
        scannedCount: 0,
        newSales: 0,
        errors: [`Account not found: ${accountId}`],
      };
    }
    accounts = [account];
    console.log(`[Scanner] Scanning single account: ${account.name}`);
  } else {
    // Scan all active accounts
    accounts = getActiveAccounts(true); // decrypt passwords
    
    // Fallback: Check for legacy IMAP config
    if (accounts.length === 0 && config.imap) {
      console.log('[Scanner] No email accounts found, using legacy IMAP config');
      return {
        scannedCount: 0,
        newSales: 0,
        errors: ['Please configure an email account. Legacy IMAP configuration is no longer supported.'],
      };
    }

    if (accounts.length === 0) {
      return {
        scannedCount: 0,
        newSales: 0,
        errors: ['No active email accounts configured. Please add an email account first.'],
      };
    }

    console.log(`[Scanner] Scanning ${accounts.length} active account(s)`);
  }

  // Scan each account with error isolation
  let totalScanned = 0;
  let totalNewSales = 0;
  const allErrors: string[] = [];

  for (const account of accounts) {
    const result = await scanSingleAccount(account, scanDays);
    totalScanned += result.scannedCount;
    totalNewSales += result.newSales;
    allErrors.push(...result.errors);
  }

  // Update last scan date
  updateConfig({ lastScanDate: new Date().toISOString() });

  console.log(`[Scanner] Multi-account scan complete. Total: ${totalNewSales} new sales from ${totalScanned} emails.`);

  return {
    scannedCount: totalScanned,
    newSales: totalNewSales,
    errors: allErrors.length > 0 ? allErrors : undefined,
  };
}

/**
 * Scan Vinted emails from a single account
 */
async function scanVintedSingleAccount(account: EmailAccount, scanDays: number): Promise<{
  scannedCount: number;
  newSales: number;
  errors: string[];
}> {
  console.log(`\n[Vinted Scanner] ========================================`);
  console.log(`[Vinted Scanner] Scanning account: ${account.name}`);
  console.log(`[Vinted Scanner] Email: ${account.username}`);
  console.log(`[Vinted Scanner] Host: ${account.host}:${account.port}`);
  console.log(`[Vinted Scanner] ========================================`);

  const errors: string[] = [];
  let scannedCount = 0;
  let newSales = 0;

  try {
    const client = new ImapClient({
      host: account.host,
      port: account.port,
      username: account.username,
      password: account.password,
      tls: account.tls,
    });

    console.log('[Vinted Scanner] Connecting to IMAP server...');
    await client.connect();
    await client.openMailbox('INBOX');

    console.log(`[Vinted Scanner] Searching for Vinted emails from last ${scanDays} days...\n`);
    
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - scanDays);
    
    // Search for emails with "Versandschein" in subject (works for both direct and forwarded Vinted emails)
    // OR from vinted.de domain (for direct emails)
    const uids = await client.searchEmails([
      ['SINCE', sinceDate],
      ['OR',
        ['SUBJECT', 'Versandschein'],
        ['FROM', 'vinted']
      ]
    ]);
    
    scannedCount = uids.length;
    console.log(`[Vinted Scanner] Found ${scannedCount} emails with Vinted shipping labels in ${account.name}\n`);

    if (uids.length === 0) {
      await client.disconnect();
      console.log('[Vinted Scanner] No Vinted emails found');
      return { scannedCount: 0, newSales: 0, errors: [] };
    }

    console.log('[Vinted Scanner] Fetching email contents...\n');
    const emails = await client.fetchMessages(uids);

    for (const email of emails) {
      try {
        if (!isVintedEmail(email)) {
          console.log(`[Vinted Scanner] ⚠️  Skipping non-Vinted email: ${email.subject.substring(0, 40)}...`);
          continue;
        }

        if (!hasVintedShippingLabel(email)) {
          console.log(`[Vinted Scanner] ⏭️  Skipping Vinted email without PDF: ${email.subject.substring(0, 40)}...`);
          continue;
        }

        const result = parseVintedEmail(email);

        const saleId = generateId();
        const savedAttachments = saveAttachments(email, saleId);

        if (savedAttachments.length === 0) {
          console.log(`[Vinted Scanner] ⚠️  No valid attachments saved for: ${email.subject.substring(0, 40)}...`);
          continue;
        }

        const sale = salesRepo.createSale({
          emailId: email.messageId,
          date: email.date.toISOString().split('T')[0],
          platform: 'Vinted/Kleiderkreisel',
          shippingCompany: result.carrier || undefined,
          itemTitle: result.itemTitle,
          accountId: account.id,
          metadata: {
            from: email.from,
            subject: email.subject,
            receivedDate: email.date.toISOString(),
            instructions: result.instructions,
          },
        });

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

    await client.disconnect();

    console.log(`[Vinted Scanner] Account ${account.name} complete: ${newSales} sales from ${scannedCount} emails`);

    return { scannedCount, newSales, errors };
  } catch (error) {
    console.error(`[Vinted Scanner] Account ${account.name} failed:`, error);
    return {
      scannedCount: 0,
      newSales: 0,
      errors: [`${account.name}: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Refresh Vinted Sales - Complete database reset and rescan
 * Optimized specifically for Vinted emails (multi-account support)
 */
export async function refreshVintedSales(): Promise<ScanResult> {
  console.log('\n========================================');
  console.log('[Vinted Scanner] Starting Vinted refresh...');
  console.log('========================================\n');
  
  const config = loadConfig();
  const scanDays = config.scanDays || 30;

  // Get all active accounts
  const accounts = getActiveAccounts(true);

  console.log(`[Vinted Scanner] Found ${accounts.length} active account(s)`);
  accounts.forEach(acc => {
    console.log(`  - ${acc.name} (${acc.username}) [Active: ${acc.isActive}]`);
  });

  if (accounts.length === 0) {
    return {
      scannedCount: 0,
      newSales: 0,
      errors: ['No active email accounts configured. Please add an email account first.'],
    };
  }

  console.log(`[Vinted Scanner] Starting scan of ${accounts.length} account(s)...`);

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

    // STEP 2: Scan each account
    let totalScanned = 0;
    let totalNewSales = 0;
    const allErrors: string[] = [];

    for (const account of accounts) {
      const result = await scanVintedSingleAccount(account, scanDays);
      totalScanned += result.scannedCount;
      totalNewSales += result.newSales;
      allErrors.push(...result.errors);
    }

    // Update last scan date
    updateConfig({ lastScanDate: new Date().toISOString() });

    console.log('\n========================================');
    console.log('[Vinted Scanner] SCAN COMPLETE');
    console.log(`  Emails checked: ${totalScanned}`);
    console.log(`  Sales imported: ${totalNewSales}`);
    console.log(`  Errors: ${allErrors.length}`);
    console.log('========================================\n');

    return {
      scannedCount: totalScanned,
      newSales: totalNewSales,
      errors: allErrors.length > 0 ? allErrors : undefined,
    };
  } catch (error) {
    console.error('[Vinted Scanner] ❌ Scan failed:', error);
    return {
      scannedCount: 0,
      newSales: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}
