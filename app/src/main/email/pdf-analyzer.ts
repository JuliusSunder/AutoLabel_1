/**
 * PDF Analyzer
 * Extracts text from PDF shipping labels to detect shipping company
 */

import fs from 'node:fs';

/**
 * Extract text content from a PDF file
 */
export async function extractTextFromPDF(pdfPath: string): Promise<string> {
  try {
    // Dynamically import pdf-parse to avoid build issues
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('[PDF Analyzer] Failed to extract text from PDF:', error);
    return '';
  }
}

/**
 * Detect shipping company from PDF content
 * This is more accurate than email content as it reads the actual label
 */
export async function detectShippingCompanyFromPDF(
  pdfPath: string
): Promise<string | undefined> {
  try {
    const text = await extractTextFromPDF(pdfPath);
    const textLower = text.toLowerCase();

    console.log('[PDF Analyzer] Analyzing PDF:', pdfPath);
    console.log('[PDF Analyzer] Extracted text length:', text.length);

    // Shipping companies with their indicators (most specific first)
    // Check for the most distinctive patterns to avoid false positives
    const companies: Record<string, string[]> = {
      Hermes: [
        'hermes',
        'myhermes',
        'hermesworld',
        'hermes logistik',
        'hermes-europe',
      ],
      DHL: [
        'dhl paket',
        'dhl express',
        'dhl.de',
        'dhl.com',
        'deutsche post dhl',
        'dhl freight',
      ],
      DPD: ['dpd.com', 'dpd.de', 'dpd ', 'dynamic parcel'],
      GLS: [
        'gls-group',
        'gls pakete',
        'gls.de',
        'general logistics',
        'gls germany',
      ],
      UPS: ['ups.com', 'ups.de', 'united parcel service', 'ups next day'],
      FedEx: ['fedex', 'federal express'],
    };

    // Try to find the most specific match
    for (const [company, indicators] of Object.entries(companies)) {
      for (const indicator of indicators) {
        if (textLower.includes(indicator)) {
          console.log(
            `[PDF Analyzer] Detected ${company} from indicator: "${indicator}"`
          );
          return company;
        }
      }
    }

    console.log('[PDF Analyzer] No shipping company detected in PDF');
    return undefined;
  } catch (error) {
    console.error('[PDF Analyzer] Error detecting shipping company:', error);
    return undefined;
  }
}

/**
 * Check if a PDF is a valid shipping label
 * Looks for common shipping label indicators
 */
export async function isShippingLabelPDF(pdfPath: string): Promise<boolean> {
  try {
    const text = await extractTextFromPDF(pdfPath);
    const textLower = text.toLowerCase();

    // Common shipping label indicators
    const indicators = [
      'tracking',
      'shipment',
      'versand',
      'sendung',
      'paket',
      'parcel',
      'delivery',
      'zustellung',
      'empfänger',
      'recipient',
      'absender',
      'sender',
      'barcode',
    ];

    const hasIndicator = indicators.some((indicator) =>
      textLower.includes(indicator)
    );

    // Also check for common patterns like tracking numbers
    const hasTrackingPattern =
      /[A-Z0-9]{10,}/.test(text) || // Generic tracking number pattern
      /\d{12,}/.test(text); // Numeric tracking patterns

    return hasIndicator || hasTrackingPattern;
  } catch (error) {
    console.error('[PDF Analyzer] Error checking if PDF is shipping label:', error);
    return false;
  }
}

