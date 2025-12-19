/**
 * PDF Thumbnail Generator
 * Generates small image previews of PDF labels for UI display
 */

import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Generate a thumbnail from a PDF file
 * Returns base64 encoded image data URL for direct use in <img> src
 * 
 * @param pdfPath - Full path to the PDF file
 * @param width - Desired thumbnail width in pixels (default: 200)
 * @returns Base64 data URL string
 */
export async function generatePDFThumbnail(
  pdfPath: string,
  width: number = 200
): Promise<string> {
  try {
    console.log(`[PDF Thumbnail] Generating thumbnail for: ${pdfPath}`);

    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      console.warn(`[PDF Thumbnail] File not found: ${pdfPath}`);
      return generatePlaceholder(width, 'File Not Found');
    }

    // Load PDF
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get first page dimensions
    const firstPage = pdfDoc.getPage(0);
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();

    // Calculate thumbnail dimensions maintaining aspect ratio
    const scale = width / pageWidth;
    const thumbHeight = Math.floor(pageHeight * scale);

    console.log(`[PDF Thumbnail] PDF size: ${pageWidth}x${pageHeight} → Thumbnail: ${width}x${thumbHeight}`);

    // For MVP: Create a simple gray rectangle as placeholder
    // In production, use pdf-poppler, pdf2pic, or similar to rasterize actual PDF content
    const placeholder = await sharp({
      create: {
        width: width,
        height: thumbHeight,
        channels: 3,
        background: { r: 245, g: 245, b: 245 }
      }
    })
      .composite([
        {
          input: Buffer.from(
            `<svg width="${width}" height="${thumbHeight}">
              <rect width="${width}" height="${thumbHeight}" fill="#f5f5f5" stroke="#ddd" stroke-width="2"/>
              <text x="50%" y="40%" text-anchor="middle" font-size="16" fill="#999" font-family="Arial">📄 PDF Label</text>
              <text x="50%" y="60%" text-anchor="middle" font-size="12" fill="#bbb" font-family="Arial">${path.basename(pdfPath)}</text>
            </svg>`
          ),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toBuffer();

    // Convert to base64 data URL
    const base64 = placeholder.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    console.log(`[PDF Thumbnail] ✅ Thumbnail generated successfully`);
    return dataUrl;

  } catch (error) {
    console.error('[PDF Thumbnail] Failed to generate thumbnail:', error);
    return generatePlaceholder(width, 'Error Loading PDF');
  }
}

/**
 * Generate a placeholder thumbnail with error message
 */
function generatePlaceholder(width: number, message: string): string {
  const height = Math.floor(width * 1.5); // 2:3 aspect ratio

  // SVG placeholder
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#f0f0f0" stroke="#ddd" stroke-width="2"/>
    <text x="50%" y="45%" text-anchor="middle" font-size="14" fill="#999" font-family="Arial">📄</text>
    <text x="50%" y="60%" text-anchor="middle" font-size="10" fill="#bbb" font-family="Arial">${message}</text>
  </svg>`;

  // Encode SVG as data URL
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Batch generate thumbnails for multiple PDFs
 * Useful for loading all thumbnails for a list of sales
 * 
 * @param pdfPaths - Array of PDF file paths
 * @param width - Desired thumbnail width
 * @returns Map of pdfPath → thumbnail data URL
 */
export async function generateBatchThumbnails(
  pdfPaths: string[],
  width: number = 200
): Promise<Map<string, string>> {
  console.log(`[PDF Thumbnail] Generating ${pdfPaths.length} thumbnails in batch...`);

  const thumbnails = new Map<string, string>();

  // Generate thumbnails in parallel (but limit concurrency to avoid memory issues)
  const batchSize = 5;
  for (let i = 0; i < pdfPaths.length; i += batchSize) {
    const batch = pdfPaths.slice(i, i + batchSize);
    const promises = batch.map(async (pdfPath) => {
      const thumbnail = await generatePDFThumbnail(pdfPath, width);
      return { pdfPath, thumbnail };
    });

    const results = await Promise.all(promises);
    results.forEach(({ pdfPath, thumbnail }) => {
      thumbnails.set(pdfPath, thumbnail);
    });
  }

  console.log(`[PDF Thumbnail] ✅ Batch generation complete: ${thumbnails.size} thumbnails`);
  return thumbnails;
}

