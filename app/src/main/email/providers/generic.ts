/**
 * Generic Email Provider
 * Works with any email containing shipping labels
 * Uses heuristic parsing instead of platform-specific logic
 */

import type { EmailMessage } from '../imap-client';
import {
  isShippingLabelEmail,
  parseSaleFromEmail,
  type ParsedSale,
} from '../email-parser';

/**
 * Process email and extract sale if it contains a shipping label
 * Returns null if email doesn't contain a shipping label
 */
export function processEmail(email: EmailMessage): ParsedSale | null {
  // Check if this email contains a shipping label
  if (!isShippingLabelEmail(email)) {
    return null;
  }

  // Parse sale metadata from email
  const sale = parseSaleFromEmail(email);

  console.log('[Generic Provider] Extracted sale:', {
    emailId: sale.emailId,
    platform: sale.platform,
    productNumber: sale.productNumber,
    attachments: email.attachments.length,
  });

  return sale;
}

/**
 * Filter emails to find those with shipping labels
 */
export function filterShippingEmails(
  emails: EmailMessage[]
): EmailMessage[] {
  return emails.filter(isShippingLabelEmail);
}

