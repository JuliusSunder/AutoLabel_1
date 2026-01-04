/**
 * PDF Analyzer
 * Extracts text from PDF shipping labels to detect shipping company
 * Uses PDF.js (pdfjs-dist) for reliable text extraction in Electron
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Validate if a file is a real PDF by checking magic bytes
 */
function isValidPDF(filePath: string): boolean {
  try {
    const buffer = fs.readFileSync(filePath);
    // Check for PDF magic bytes: %PDF (37 80 68 70)
    return buffer.length >= 4 && 
           buffer[0] === 0x25 && 
           buffer[1] === 0x50 && 
           buffer[2] === 0x44 && 
           buffer[3] === 0x46;
  } catch (error) {
    console.error('[PDF Analyzer] Error checking PDF magic bytes:', error);
    return false;
  }
}

/**
 * Extract text content from a PDF file using PDF.js
 * This is more reliable than pdf-parse in Electron+Vite environment
 */
export async function extractTextFromPDF(pdfPath: string): Promise<string> {
  try {
    // First validate that this is a real PDF
    if (!isValidPDF(pdfPath)) {
      console.error('[PDF Analyzer] ❌ File is not a valid PDF (magic bytes check failed):', pdfPath);
      return '';
    }

    console.log('[PDF Analyzer] 📄 Extracting text from PDF:', pdfPath);

    // Import PDF.js dynamically (already used successfully in vinted.ts and pdf-thumbnail.ts)
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Read PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = new Uint8Array(pdfBuffer);
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      disableFontFace: false,
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    console.log(`[PDF Analyzer] 📖 PDF loaded, pages: ${numPages}`);
    
    // Extract text from all pages
    let extractedText = '';
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items with spaces
      const pageText = textContent.items
        .map((item: any) => {
          // Handle both string items and items with 'str' property
          if (typeof item === 'string') return item;
          if (item.str) return item.str;
          return '';
        })
        .join(' ');
      
      extractedText += pageText + '\n';
    }
    
    const textLength = extractedText.length;

    if (textLength === 0) {
      console.warn('[PDF Analyzer] ⚠️  PDF parsed successfully but no text extracted');
      console.warn('[PDF Analyzer] ⚠️  This might be a scanned PDF or image-based PDF');
      console.warn('[PDF Analyzer] ⚠️  PDF info:', {
        pages: numPages,
      });
    } else {
      console.log('[PDF Analyzer] ✅ Successfully extracted text, length:', textLength);
      // Log a preview of the extracted text (first 500 chars) for debugging
      const preview = extractedText.substring(0, 500).replace(/\s+/g, ' ').trim();
      console.log('[PDF Analyzer] 📝 Text preview:', preview);
    }

    return extractedText;
  } catch (error) {
    console.error('[PDF Analyzer] ❌ Failed to extract text from PDF:', pdfPath);
    console.error('[PDF Analyzer] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
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
    console.log('[PDF Analyzer] 🔍 Starting shipping company detection for:', pdfPath);
    
    // Check filename for hints (useful when logo is not extracted as text)
    const filename = path.basename(pdfPath).toLowerCase();
    console.log('[PDF Analyzer] 📄 Filename:', filename);
    
    const text = await extractTextFromPDF(pdfPath);
    
    if (!text || text.length === 0) {
      console.warn('[PDF Analyzer] ⚠️  Cannot detect shipping company: No text extracted from PDF');
      return undefined;
    }

    const textLower = text.toLowerCase();
    console.log('[PDF Analyzer] 📊 Analyzing text, length:', text.length);

    // Shipping companies with their indicators (most specific first)
    // Check for the most distinctive patterns to avoid false positives
    const companies: Record<string, string[]> = {
      Hermes: [
        'hermes',
        'myhermes',
        'hermesworld',
        'hermes logistik',
        'hermes-europe',
        'hermes paketdienst',
        'hermes paket',
      ],
      DHL: [
        'dhl paket',
        'dhl express',
        'dhl.de',
        'dhl.com',
        'deutsche post dhl',
        'dhl freight',
        'dhl paketdienst',
        'dhl',
      ],
      DPD: [
        'dpd.com', 
        'dpd.de', 
        'dpd ', 
        'dynamic parcel',
        'dpd paketdienst',
        'dpd',
      ],
      GLS: [
        'gls-group',
        'gls pakete',
        'gls.de',
        'general logistics',
        'gls germany',
        'gls paketdienst',
        'gls',
        // GLS-specific patterns when logo is not extracted as text
        'gls parcel service',
        'gls germany gmbh',
      ],
      UPS: [
        'ups.com', 
        'ups.de', 
        'united parcel service', 
        'ups next day',
        'ups paketdienst',
        'ups',
      ],
      FedEx: [
        'fedex', 
        'federal express',
        'fedex.com',
      ],
    };

    // Try to find the most specific match
    for (const [company, indicators] of Object.entries(companies)) {
      for (const indicator of indicators) {
        if (textLower.includes(indicator)) {
          console.log(
            `[PDF Analyzer] ✅ Detected ${company} from indicator: "${indicator}"`
          );
          return company;
        }
      }
    }

    // Fallback: Heuristic detection for Vinted labels where carrier logo is not extracted as text
    // GLS labels from Vinted often have "Label" in filename and specific text patterns
    const isVintedLabel = filename.includes('vinted') || filename.includes('kleiderkreisel');
    
    if (isVintedLabel) {
      console.log('[PDF Analyzer] 🔍 Vinted label detected, trying heuristic detection...');
      
      // GLS-specific heuristic: Vinted-Label-* files with "paketshop" but no other carrier name
      if (filename.includes('label-') && textLower.includes('paketshop')) {
        // Check that it's not another carrier
        const hasOtherCarrier = 
          textLower.includes('hermes') ||
          textLower.includes('dhl') ||
          textLower.includes('dpd') ||
          textLower.includes('ups');
        
        if (!hasOtherCarrier) {
          console.log('[PDF Analyzer] ✅ Detected GLS via heuristic (Vinted-Label with paketshop, no other carrier)');
          return 'GLS';
        }
      }
    }

    console.warn('[PDF Analyzer] ⚠️  No shipping company detected in PDF');
    console.warn('[PDF Analyzer] 💡 Text sample for debugging:', 
      textLower.substring(0, 300).replace(/\s+/g, ' ').trim()
    );
    return undefined;
  } catch (error) {
    console.error('[PDF Analyzer] ❌ Error detecting shipping company:', pdfPath);
    console.error('[PDF Analyzer] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
    });
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

