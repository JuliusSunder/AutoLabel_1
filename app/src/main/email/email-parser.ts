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
 * Check if an attachment filename suggests it's a shipping label (not an invoice/receipt)
 */
export function isLikelyShippingLabel(filename: string): boolean {
  const lower = filename.toLowerCase();
  
  // Negative indicators (suggests NOT a shipping label) - check these FIRST
  const nonLabelKeywords = [
    'invoice', 'rechnung', 'receipt', 'beleg', 'quittung',
    'bill', 'statement', 'bestätigung', 'confirmation',
    'order', 'auftrag', 'payment', 'zahlung', 'kaufbeleg',
    'bestellung', 'zahlungsbestätigung'
  ];
  
  // If it clearly looks like an invoice/receipt, reject it
  const hasNegativeIndicator = nonLabelKeywords.some(kw => lower.includes(kw));
  if (hasNegativeIndicator) {
    console.log(`[Email Parser] Rejecting attachment (invoice/receipt): ${filename}`);
    return false;
  }
  
  // Positive indicators (strongly suggests shipping label)
  const labelKeywords = [
    'label', 'versandschein', 'versandetikett', 'paketschein',
    'shipping', 'shipment', 'tracking', 'carrier', 
    'hermes', 'dhl', 'dpd', 'gls', 'ups', 'fedex',
    'paket', 'sendung', 'frankierung'
  ];
  
  // Check for positive indicators
  const hasPositiveIndicator = labelKeywords.some(kw => lower.includes(kw));
  if (hasPositiveIndicator) {
    console.log(`[Email Parser] Accepting attachment (shipping label): ${filename}`);
    return true;
  }
  
  // If no clear indicators, REJECT IT (strict approach)
  // Only files with clear label indicators should pass
  console.log(`[Email Parser] Rejecting attachment (no label indicators): ${filename}`);
  return false;
}

/**
 * Check if an email is likely to contain a shipping label
 */
export function isShippingLabelEmail(email: EmailMessage): boolean {
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  const from = email.from.toLowerCase();
  const combinedText = `${subject} ${body} ${from}`;

  // Negative keywords that suggest it's NOT a shipping label (check FIRST)
  const negativeKeywords = [
    'rechnung', 'invoice', 'payment', 'zahlung', 'receipt', 'quittung',
    'kaufbeleg', 'zahlungsbestätigung', 'bestellung'
  ];

  // Check for negative indicators - reject immediately
  const hasNegativeIndicator = negativeKeywords.some(keyword => combinedText.includes(keyword));
  if (hasNegativeIndicator) {
    console.log(`[Email Parser] Rejecting email (invoice/payment): ${subject.substring(0, 50)}...`);
    return false;
  }

  // German keywords for shipping labels
  const germanLabelKeywords = [
    'versandlabel',
    'versandetikett',
    'versandschein',
    'paketschein',
    'frankierung',
  ];

  // English keywords for shipping labels
  const englishLabelKeywords = [
    'shipping label',
    'shipment label',
    'tracking label',
    'return label',
  ];

  // Carrier names (strong indicator of shipping label)
  const carrierKeywords = [
    'dhl',
    'hermes',
    'dpd',
    'ups',
    'gls',
    'fedex',
  ];

  const allKeywords = [...germanLabelKeywords, ...englishLabelKeywords, ...carrierKeywords];

  // Check if subject or body contains any positive keywords
  const hasKeyword = allKeywords.some(keyword => combinedText.includes(keyword));

  // Must have attachments (PDF or image)
  if (email.attachments.length === 0) {
    console.log(`[Email Parser] Rejecting email (no attachments): ${subject.substring(0, 50)}...`);
    return false;
  }

  // Check if any attachment looks like a shipping label
  const hasLabelAttachment = email.attachments.some((att) => {
    const filename = att.filename.toLowerCase();
    const isPdfOrImage = filename.endsWith('.pdf') || filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg');
    return isPdfOrImage && isLikelyShippingLabel(filename);
  });

  const isLabel = hasKeyword && hasLabelAttachment;
  
  if (isLabel) {
    console.log(`[Email Parser] Accepting email (shipping label): ${subject.substring(0, 50)}...`);
  } else {
    console.log(`[Email Parser] Rejecting email (no label indicators): ${subject.substring(0, 50)}...`);
  }

  return isLabel;
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
 * Extract item title from email subject
 */
function extractItemTitle(subject: string, body: string): string | undefined {
  // Clean up email subject
  let title = subject
    .replace(/^(Re:|Fwd?:|AW:|WG:)\s*/gi, '') // Remove reply prefixes
    .replace(/^\[.*?\]\s*/, '') // Remove [tags]
    .trim();
  
  // Remove common order/shipping notification patterns to get actual item
  title = title
    .replace(/^(Auftragsbestätigung|Bestellbestätigung|Versandbestätigung|Bestätigung)\s+/gi, '')
    .replace(/^(Order Confirmation|Shipping Confirmation)\s+/gi, '')
    .replace(/\s+(für|for|zum|to)\s+Auftrag\s+#?\d+/gi, '') // Remove order numbers
    .replace(/\s+#\d{10,}/g, '') // Remove long numbers (order IDs)
    .trim();
  
  // If title is still meaningful, use it
  if (title.length >= 10 && title.length <= 150) {
    return title;
  }
  
  // Try to extract from email body
  const bodyPatterns = [
    /(?:Artikel|Item|Product)\s*:?\s*([^\n]{10,100})/i,
    /(?:Bezeichnung|Title|Name)\s*:?\s*([^\n]{10,100})/i,
  ];

  for (const pattern of bodyPatterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Last resort: return cleaned subject even if short
  if (title.length > 0) {
    return title;
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
 * Platform = where the sale happened (eBay, Vinted, etc.)
 * This is DIFFERENT from shipping company!
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
      console.log(`[Email Parser] Detected platform: ${platform}`);
      return platform;
    }
  }

  return undefined;
}

/**
 * Detect shipping company from email content and attachments
 * Shipping company = who delivers the package (DHL, Hermes, etc.)
 * This is DIFFERENT from platform!
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
  // NOTE: Platform names (vinted, kleiderkreisel, ebay, etc.) are NOT shipping companies
  const companies: Record<string, string[]> = {
    Hermes: ['myhermes.de', '@myhermes', 'hermesworld', 'hermes-europe', 'hermes logistik', 'hermes'],
    DHL: ['dhl paket', 'dhl express', 'dhl.de', 'dhl.com', '@dhl', 'deutsche post dhl', 'noreply@dhl'],
    DPD: ['dpd.com', 'dpd.de', '@dpd', 'dpd.co', 'dynamic parcel'],
    GLS: ['gls-group', 'gls.de', '@gls', 'gls pakete', 'general logistics'],
    UPS: ['ups.com', 'ups.de', '@ups', 'united parcel service'],
    FedEx: ['fedex.com', '@fedex', 'federal express'],
  };

  // For Vinted emails, we need to be more careful
  // Only detect carrier if explicitly mentioned in subject or filename
  const isVintedEmail = from.includes('vinted') || from.includes('kleiderkreisel');
  
  if (isVintedEmail) {
    console.log(`[Email Parser] Vinted email detected - checking subject and filenames for carrier...`);
    
    // For Vinted, check subject and filenames more carefully
    const subjectAndFilenames = `${subject} ${attachmentNames}`;
    
    // Look for carrier names in subject or attachment names (not in body or from)
    if (subjectAndFilenames.includes('hermes') || subjectAndFilenames.includes('myhermes')) {
      console.log(`[Email Parser] Detected Hermes from Vinted email`);
      return 'Hermes';
    } else if (subjectAndFilenames.includes('dhl')) {
      console.log(`[Email Parser] Detected DHL from Vinted email`);
      return 'DHL';
    } else if (subjectAndFilenames.includes('dpd')) {
      console.log(`[Email Parser] Detected DPD from Vinted email`);
      return 'DPD';
    } else if (subjectAndFilenames.includes('gls')) {
      console.log(`[Email Parser] Detected GLS from Vinted email`);
      return 'GLS';
    } else if (subjectAndFilenames.includes('ups')) {
      console.log(`[Email Parser] Detected UPS from Vinted email`);
      return 'UPS';
    }
    
    // No carrier found in Vinted email - don't default, return undefined
    console.log(`[Email Parser] Could not detect carrier from Vinted email - subject or filename doesn't mention carrier`);
    return undefined;
  }

  // For non-Vinted emails, use full detection
  for (const [company, indicators] of Object.entries(companies)) {
    if (indicators.some(ind => allText.includes(ind))) {
      console.log(`[Email Parser] Detected shipping company: ${company} (from email)`);
      return company;
    }
  }

  console.log(`[Email Parser] No shipping company detected from email`);
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
    itemTitle: extractItemTitle(email.subject, email.body),
    buyerRef: extractBuyerRef(combinedText),
    metadata: {
      from: email.from,
      subject: email.subject,
      receivedDate: email.date.toISOString(),
    },
  };
}
