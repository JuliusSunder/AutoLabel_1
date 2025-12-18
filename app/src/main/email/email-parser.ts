/**
 * Email Parser
 * Extracts sale metadata from email content
 */

import type { EmailMessage } from './imap-client';

export interface ParsedSale {
  emailId: string;
  date: string; // ISO date
  platform?: string;
  shippingCompany?: string;
  productNumber?: string;
  itemTitle?: string;
  buyerRef?: string;
  metadata?: Record<string, any>;
}

/**
 * Check if an email is likely to contain a shipping label
 */
export function isShippingLabelEmail(email: EmailMessage): boolean {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();

  // German keywords
  const germanKeywords = [
    'versandlabel',
    'versandetikett',
    'versand',
    'paketschein',
    'dhl',
    'hermes',
    'dpd',
    'ups',
  ];

  // English keywords
  const englishKeywords = [
    'shipping label',
    'shipment',
    'tracking',
    'ship',
    'label',
    'order',
  ];

  const keywords = [...germanKeywords, ...englishKeywords];

  // Check if subject or body contains any keywords
  const hasKeyword = keywords.some(
    (keyword) => subject.includes(keyword) || body.includes(keyword)
  );

  // Must have attachments (PDF or image)
  const hasAttachments = email.attachments.length > 0;
  const hasLabelAttachment = email.attachments.some((att) => {
    const ext = att.filename.toLowerCase();
    return ext.endsWith('.pdf') || ext.endsWith('.png') || ext.endsWith('.jpg');
  });

  return hasKeyword && hasAttachments && hasLabelAttachment;
}

/**
 * Extract product number from text
 */
function extractProductNumber(text: string): string | undefined {
  // Common patterns for product numbers
  const patterns = [
    /(?:Art\.?-?Nr\.?|Artikel|Item|Product)\s*:?\s*([A-Z0-9-]+)/i,
    /(?:#|Nr\.?)\s*([0-9]{6,})/i,
    /\b([A-Z]{2,3}[0-9]{6,})\b/, // e.g., ABC123456
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extract item title from text
 */
function extractItemTitle(text: string): string | undefined {
  // Try to find item/product title in common patterns
  const patterns = [
    /(?:Artikel|Item|Product)\s*:?\s*([^\n]{10,100})/i,
    /(?:Bezeichnung|Title|Name)\s*:?\s*([^\n]{10,100})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: use first line (email subject) as title
  const subject = text.split('\n')[0]?.trim();
  if (subject && subject.length > 0) {
    // Clean up common email prefixes
    const cleaned = subject
      .replace(/^(Re:|Fwd?:|AW:|WG:)\s*/gi, '')
      .replace(/^\[.*?\]\s*/, '')
      .trim();
    
    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  return undefined;
}

/**
 * Extract buyer reference from text
 */
function extractBuyerRef(text: string): string | undefined {
  const patterns = [
    /(?:Käufer|Buyer|Customer)\s*:?\s*([A-Za-z0-9_-]+)/i,
    /(?:Ref|Reference|Referenz)\s*:?\s*([A-Za-z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Detect platform from email sender or content
 */
function detectPlatform(email: EmailMessage): string | undefined {
  const from = email.from.toLowerCase();
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();

  const platforms: Record<string, string[]> = {
    eBay: ['ebay.de', 'ebay.com', 'ebay'],
    Amazon: ['amazon.de', 'amazon.com', 'amazon'],
    Etsy: ['etsy.com', 'etsy'],
    Shopify: ['shopify.com', 'shopify'],
    'Vinted/Kleiderkreisel': ['vinted', 'kleiderkreisel'],
  };

  for (const [platform, indicators] of Object.entries(platforms)) {
    if (
      indicators.some(
        (ind) =>
          from.includes(ind) || subject.includes(ind) || body.includes(ind)
      )
    ) {
      return platform;
    }
  }

  return undefined;
}

/**
 * Detect shipping company from email content and attachments
 */
function detectShippingCompany(email: EmailMessage): string | undefined {
  const from = email.from.toLowerCase();
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  
  // Check attachment filenames
  const attachmentNames = email.attachments
    .map(att => att.filename.toLowerCase())
    .join(' ');

  const allText = `${from} ${subject} ${body} ${attachmentNames}`;

  // Shipping companies with their indicators (most specific first)
  const companies: Record<string, string[]> = {
    DHL: ['dhl', 'dhl.de', 'dhl.com', 'deutsche post'],
    Hermes: ['hermes', 'myhermes', 'hermesworld'],
    DPD: ['dpd', 'dpd.de', 'dpd.com'],
    GLS: ['gls', 'gls-group', 'gls.de'],
    UPS: ['ups.com', 'ups.de', 'united parcel'],
  };

  for (const [company, indicators] of Object.entries(companies)) {
    if (indicators.some(ind => allText.includes(ind))) {
      return company;
    }
  }

  return undefined;
}

/**
 * Parse sale metadata from email
 */
export function parseSaleFromEmail(email: EmailMessage): ParsedSale {
  const combinedText = `${email.subject}\n${email.body}`;

  return {
    emailId: email.messageId,
    date: email.date.toISOString().split('T')[0], // YYYY-MM-DD
    platform: detectPlatform(email),
    shippingCompany: detectShippingCompany(email),
    productNumber: extractProductNumber(combinedText),
    itemTitle: extractItemTitle(email.subject) || extractItemTitle(email.body),
    buyerRef: extractBuyerRef(combinedText),
    metadata: {
      from: email.from,
      subject: email.subject,
      receivedDate: email.date.toISOString(),
    },
  };
}
