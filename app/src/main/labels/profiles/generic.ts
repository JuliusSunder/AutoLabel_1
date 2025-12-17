/**
 * Generic Label Profile
 * Simple fit-to-size scaling for any PDF or image
 * This is the MVP profile that works with most labels
 */

import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import type { LabelProfile } from './base';
import {
  getTargetPixelDimensions,
  TARGET_SIZE_MM,
  TARGET_DPI,
  calculateFitScale,
  calculateCenteredPosition,
} from '../utils';

/**
 * Get temp directory for processed labels
 */
function getTempDir(): string {
  const userDataPath = app.getPath('userData');
  const tempPath = path.join(userDataPath, 'temp');

  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }

  return tempPath;
}

/**
 * Process a PDF label
 */
async function processPdf(inputPath: string): Promise<string> {
  console.log('[Generic Profile] Processing PDF:', inputPath);

  // Load the PDF
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Get first page
  const firstPage = pdfDoc.getPage(0);
  const { width: pageWidth, height: pageHeight } = firstPage.getSize();

  console.log(`[Generic Profile] Original PDF size: ${pageWidth}x${pageHeight} points`);

  // Convert PDF page to image using sharp
  // For MVP, we'll just scale the PDF page dimensions
  // In production, you'd use pdf-poppler or similar to rasterize
  const targetDimensions = getTargetPixelDimensions();

  // Calculate scale to fit
  const scale = calculateFitScale(
    pageWidth,
    pageHeight,
    targetDimensions.width,
    targetDimensions.height
  );

  // Create new PDF at target size
  const newPdf = await PDFDocument.create();
  const newPage = newPdf.addPage([targetDimensions.width, targetDimensions.height]);

  // Embed the original page
  const [embeddedPage] = await newPdf.embedPdf(pdfDoc, [0]);

  // Calculate scaled dimensions
  const scaledWidth = pageWidth * scale;
  const scaledHeight = pageHeight * scale;

  // Calculate centered position
  const { x, y } = calculateCenteredPosition(
    scaledWidth,
    scaledHeight,
    targetDimensions.width,
    targetDimensions.height
  );

  // Draw the embedded page scaled and centered
  newPage.drawPage(embeddedPage, {
    x,
    y,
    width: scaledWidth,
    height: scaledHeight,
  });

  // Save to temp file
  const outputPath = path.join(
    getTempDir(),
    `processed_${Date.now()}.pdf`
  );
  const newPdfBytes = await newPdf.save();
  fs.writeFileSync(outputPath, newPdfBytes);

  console.log('[Generic Profile] Saved processed PDF:', outputPath);

  return outputPath;
}

/**
 * Process an image label
 */
async function processImage(inputPath: string): Promise<string> {
  console.log('[Generic Profile] Processing image:', inputPath);

  const targetDimensions = getTargetPixelDimensions();

  // Load image metadata
  const metadata = await sharp(inputPath).metadata();
  const sourceWidth = metadata.width || 0;
  const sourceHeight = metadata.height || 0;

  console.log(
    `[Generic Profile] Original image size: ${sourceWidth}x${sourceHeight}`
  );

  // Resize image to fit target dimensions while maintaining aspect ratio
  const outputPath = path.join(
    getTempDir(),
    `processed_${Date.now()}.png`
  );

  await sharp(inputPath)
    .resize(targetDimensions.width, targetDimensions.height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(outputPath);

  console.log('[Generic Profile] Saved processed image:', outputPath);

  return outputPath;
}

/**
 * Generic profile implementation
 */
export const genericProfile: LabelProfile = {
  id: 'generic',
  name: 'Generic Label',

  /**
   * Generic profile matches all files (fallback)
   */
  async detect(filePath: string): Promise<boolean> {
    return true;
  },

  /**
   * Process label file (PDF or image)
   */
  async process(filePath: string): Promise<{
    outputPath: string;
    width: number;
    height: number;
  }> {
    const ext = path.extname(filePath).toLowerCase();

    let outputPath: string;

    if (ext === '.pdf') {
      outputPath = await processPdf(filePath);
    } else {
      outputPath = await processImage(filePath);
    }

    return {
      outputPath,
      width: TARGET_SIZE_MM.width,
      height: TARGET_SIZE_MM.height,
    };
  },
};
