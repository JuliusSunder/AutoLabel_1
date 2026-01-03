/**
 * Vinted-Specific Email Parser
 * Extracts carrier information from Vinted email body text
 * Vinted includes shipping instructions in the email body that mention the carrier
 */

import type { EmailMessage } from '../imap-client';

export interface VintedParseResult {
  carrier: 'Hermes' | 'DPD' | 'DHL' | 'GLS' | 'UPS' | null;
  itemTitle: string;
  productNumber?: string;
  instructions: string;
}

/**
 * Extract product number from title (after "|" separator)
 * Users put product numbers after the "|" separator
 * Works with or without spaces: "Item | 123" or "Item|123"
 * Extracts consecutive digits from left to right after the separator
 * 
 * Examples:
 * - "Item | 12345" -> "12345"
 * - "Item |12345" -> "12345"
 * - "Item| 12345" -> "12345"
 * - "Item|12345" -> "12345"
 * - "Item | 42" -> "42"
 * - "Item | " -> undefined
 * - "Item" -> undefined
 */
function extractProductNumber(subject: string): string | undefined {
  console.log(`[Vinted Parser] Extracting product number from subject: "${subject}"`);
  
  // Find the "|" separator (with or without spaces)
  const separatorIndex = subject.indexOf('|');
  
  if (separatorIndex === -1) {
    console.log('[Vinted Parser] No "|" separator found');
    return undefined; // No separator found
  }
  
  // Get text after the separator and trim whitespace
  const afterSeparator = subject.substring(separatorIndex + 1).trim();
  console.log(`[Vinted Parser] Text after "|": "${afterSeparator}"`);
  
  if (!afterSeparator) {
    console.log('[Vinted Parser] Nothing after separator');
    return undefined; // Nothing after separator
  }
  
  // Extract consecutive digits from the start (left to right)
  let productNumber = '';
  for (let i = 0; i < Math.min(afterSeparator.length, 5); i++) {
    const char = afterSeparator[i];
    if (/\d/.test(char)) {
      productNumber += char;
    } else {
      // Stop at first non-digit character
      break;
    }
  }
  
  console.log(`[Vinted Parser] Extracted product number: "${productNumber || 'none'}"`);
  return productNumber || undefined;
}

/**
 * Extract item title from Vinted email subject
 * Format: "Versandschein für [ITEM] | [NUMBER]..." or "Versandschein für [ITEM]|[NUMBER]..."
 * Returns only the item part (before "|")
 */
function extractItemTitle(subject: string): string {
  // Remove "Versandschein für" prefix
  let title = subject.replace(/^Versandschein\s+für\s+/i, '');
  
  // Split at "|" separator and take only the first part (item title)
  const separatorIndex = title.indexOf('|');
  if (separatorIndex !== -1) {
    title = title.substring(0, separatorIndex);
  }
  
  // Trim and clean up
  title = title.trim();
  
  return title || 'Untitled';
}

/**
 * Extract shipping instructions from email body
 * Returns first 200 characters of instructions section
 */
function extractInstructions(body: string): string {
  // Look for common instruction keywords
  const instructionStart = body.search(/(?:bringe|gib|versende|paket|sendung)/i);
  
  if (instructionStart >= 0) {
    const instructions = body.substring(instructionStart, instructionStart + 200);
    return instructions.trim();
  }
  
  return '';
}

/**
 * Parse Vinted email and extract carrier from body text
 * 
 * Vinted emails contain instructions like:
 * - "Bringe dein Paket zu einem Hermes PaketShop"
 * - "Gib dein Paket bei DPD ab"
 * - "Versende mit DHL"
 */
export function parseVintedEmail(email: EmailMessage): VintedParseResult {
  const body = email.body.toLowerCase();
  const subject = email.subject.toLowerCase();
  
  console.log('[Vinted Parser] Parsing email:', email.subject.substring(0, 60) + '...');
  console.log('[Vinted Parser] Email body preview (first 1500 chars):');
  console.log(body.substring(0, 1500));
  console.log('[Vinted Parser] ---');
  
  // Carrier detection patterns - ordered by specificity
  const carrierPatterns: Record<string, RegExp[]> = {
    Hermes: [
      /hermes[-\s]?(paketshop|box)/i, // Matches "hermes paketshop", "hermes-box", "hermesbox"
      /annahmestelle\s+von\s+hermes/i,
      /bei\s+hermes/i,
      /zu\s+hermes/i,
      /zu\s+einem\s+hermes/i,
      /myhermes/i,
      /hermesworld/i
    ],
    DPD: [
      /dpd\s+(paketshop|pickup)/i,
      /annahmestelle\s+von\s+dpd/i,
      /bei\s+dpd/i,
      /zu\s+dpd/i,
      /zu\s+einem\s+dpd/i
    ],
    DHL: [
      /dhl\s+(paketshop|packstation)/i,
      /annahmestelle\s+von\s+dhl/i,
      /bei\s+dhl/i,
      /zu\s+dhl/i,
      /zu\s+einer\s+dhl/i,
      /deutsche\s+post/i,
      /postfiliale/i
    ],
    GLS: [
      /gls\s+(paketshop|send)/i, // Matches "gls paketshop", "gls send@parcelshop"
      /annahmestelle\s+von\s+gls/i,
      /bei\s+gls/i,
      /zu\s+gls/i,
      /zu\s+einem\s+gls/i
    ],
    UPS: [
      /ups\s+access\s+point/i,
      /annahmestelle\s+von\s+ups/i,
      /bei\s+ups/i,
      /zu\s+ups/i,
      /zu\s+einem\s+ups/i
    ]
  };
  
  // Check body first (most reliable)
  for (const [carrier, patterns] of Object.entries(carrierPatterns)) {
    for (const pattern of patterns) {
      console.log(`[Vinted Parser] Testing pattern for ${carrier}: ${pattern}`);
      if (pattern.test(body)) {
        console.log(`[Vinted Parser] ✅ Detected ${carrier} from body (matched: ${pattern})`);
        return {
          carrier: carrier as any,
          itemTitle: extractItemTitle(email.subject),
          productNumber: extractProductNumber(email.subject),
          instructions: extractInstructions(body)
        };
      }
    }
  }
  
  console.log('[Vinted Parser] ⚠️  No pattern matched in body');
  
  // Fallback: Check subject line (less reliable)
  for (const [carrier, patterns] of Object.entries(carrierPatterns)) {
    // Only check simple carrier name in subject
    if (subject.includes(carrier.toLowerCase())) {
      console.log(`[Vinted Parser] ⚠️  Detected ${carrier} from subject (less reliable)`);
      return {
        carrier: carrier as any,
        itemTitle: extractItemTitle(email.subject),
        productNumber: extractProductNumber(email.subject),
        instructions: extractInstructions(body)
      };
    }
  }
  
  console.log('[Vinted Parser] ⚠️  No carrier detected');
  return {
    carrier: null,
    itemTitle: extractItemTitle(email.subject),
    productNumber: extractProductNumber(email.subject),
    instructions: extractInstructions(body)
  };
}

/**
 * Check if an email is from Vinted (including forwarded emails)
 */
export function isVintedEmail(email: EmailMessage): boolean {
  const from = email.from.toLowerCase();
  const subject = email.subject.toLowerCase();
  const body = email.body.toLowerCase();
  
  // Check if from Vinted directly
  if (from.includes('vinted') || from.includes('kleiderkreisel')) {
    return true;
  }
  
  // Check for forwarded Vinted emails
  // They have "Versandschein" in subject and Vinted in body
  if (subject.includes('versandschein') && 
      (body.includes('vinted') || body.includes('kleiderkreisel'))) {
    return true;
  }
  
  return false;
}

/**
 * Check if a Vinted email has a PDF attachment (shipping label)
 */
export function hasVintedShippingLabel(email: EmailMessage): boolean {
  return email.attachments.some(att => 
    att.contentType.includes('pdf') || 
    att.filename.toLowerCase().endsWith('.pdf')
  );
}

