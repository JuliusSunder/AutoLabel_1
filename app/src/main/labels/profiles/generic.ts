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

  // Get first page only (ignore multi-page PDFs like Hermes "Zusammenfassung")
  const firstPage = pdfDoc.getPage(0);
  const { width: pageWidth, height: pageHeight } = firstPage.getSize();

  console.log(`[Generic Profile] Original PDF size: ${pageWidth}x${pageHeight} points (first page only)`);

  const targetDimensions = getTargetPixelDimensions();
  const { getContentHeightPixels } = await import('../utils');
  const contentHeight = getContentHeightPixels();

  // Create new PDF at target size (fit to content area, leaving space for footer)
  const newPdf = await PDFDocument.create();
  
  // Calculate target size in PDF points (72 DPI)
  const targetWidthPoints = (targetDimensions.width * 72) / 300; // Convert from 300 DPI pixels to points
  const targetHeightPoints = (contentHeight * 72) / 300;
  
  const isLandscape = pageWidth > pageHeight;
  console.log(`[Generic Profile] PDF orientation: ${isLandscape ? 'landscape' : 'portrait'}`);
  
  const newPage = newPdf.addPage([targetWidthPoints, targetHeightPoints]);

  // Embed only the first page
  const [embeddedPage] = await newPdf.embedPdf(pdfDoc, [0]);

  // Calculate scale to fit (handle both orientations)
  const scale = calculateFitScale(
    pageWidth,
    pageHeight,
    targetWidthPoints,
    targetHeightPoints
  );

  const scaledWidth = pageWidth * scale;
  const scaledHeight = pageHeight * scale;

  // Calculate centered position
  const { x, y } = calculateCenteredPosition(
    scaledWidth,
    scaledHeight,
    targetWidthPoints,
    targetHeightPoints
  );

  // Draw the embedded page scaled and centered
  newPage.drawPage(embeddedPage, {
    x,
    y,
    width: scaledWidth,
    height: scaledHeight,
  });

  // Save to temp file as PDF first
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
 * Process an image label with intelligent cropping
 */
async function processImage(inputPath: string): Promise<string> {
  console.log('[Generic Profile] Processing image:', inputPath);

  const targetDimensions = getTargetPixelDimensions();
  const { getContentHeightPixels } = await import('../utils');
  const contentHeight = getContentHeightPixels(); // Reserve space for footer

  // Load image
  let image = sharp(inputPath);
  let metadata = await image.metadata();

  console.log(
    `[Generic Profile] Original image size: ${metadata.width}x${metadata.height}`
  );

  // Step 1: Trim whitespace (remove white borders)
  console.log('[Generic Profile] Step 1: Trimming whitespace...');
  image = sharp(inputPath).trim({
    threshold: 240, // Consider pixels with RGB > 240 as white
  });
  metadata = await image.metadata();
  console.log(`[Generic Profile] After trim: ${metadata.width}x${metadata.height}`);

  // Step 2: Check orientation and rotate if landscape
  const isLandscape = (metadata.width || 0) > (metadata.height || 0);
  if (isLandscape) {
    console.log('[Generic Profile] Step 2: Rotating landscape to portrait (90° CCW)...');
    image = image.rotate(-90); // Rotate counter-clockwise
    metadata = await image.metadata();
    console.log(`[Generic Profile] After rotation: ${metadata.width}x${metadata.height}`);
  } else {
    console.log('[Generic Profile] Step 2: Already portrait orientation, no rotation needed');
  }

  // Step 3: Resize to fit content area (leaving space for footer)
  console.log('[Generic Profile] Step 3: Resizing to target dimensions...');
  const outputPath = path.join(
    getTempDir(),
    `processed_${Date.now()}.png`
  );

  await image
    .resize(targetDimensions.width, contentHeight, {
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
