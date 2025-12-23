/**
 * Vinted Label Profile
 * Handles Vinted shipping labels from DHL, Hermes, GLS, DPD
 * 
 * Each carrier has different formatting requirements:
 * - DPD: No rotation, crop to upper-left corner
 * - Hermes, GLS, DHL: Crop upper half, rotate 90° counter-clockwise
 * 
 * Implementation:
 * - Uses ImageMagick for reliable PDF/image processing
 * - Command: -gravity North -crop 100%x50%+0+0 -rotate -90 +repage
 * - Carrier-specific processing functions
 * - Support for both PDF and image formats
 */

import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import type { LabelProfile, ProfileContext } from './base';
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
 * Process DPD PDF: No rotation, crop to upper-left corner
 * Strategy: Draw the full page, but position it so only upper-left quadrant is visible
 */
async function processDpdPdf(inputPath: string): Promise<string> {
  console.log('[Vinted Profile] Processing DPD PDF (no rotation, crop upper-left)');

  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const firstPage = pdfDoc.getPage(0);
  const { width: pageWidth, height: pageHeight } = firstPage.getSize();

  console.log(`[Vinted Profile] Original PDF size: ${pageWidth}x${pageHeight} points`);

  const targetDimensions = getTargetPixelDimensions();
  const { getContentHeightPixels } = await import('../utils');
  const contentHeight = getContentHeightPixels();

  const targetWidthPoints = (targetDimensions.width * 72) / 300;
  const targetHeightPoints = (contentHeight * 72) / 300;

  // DPD: We want to show only the upper-left quadrant
  const cropWidth = pageWidth / 2;
  const cropHeight = pageHeight / 2;

  console.log(`[Vinted Profile] Cropping to upper-left: ${cropWidth}x${cropHeight} points`);

  // Create new PDF at target size
  const newPdf = await PDFDocument.create();
  const newPage = newPdf.addPage([targetWidthPoints, targetHeightPoints]);

  // Embed the first page
  const [embeddedPage] = await newPdf.embedPdf(pdfDoc, [0]);

  // Calculate scale to fit the cropped area (upper-left quadrant) into target size
  const scale = calculateFitScale(cropWidth, cropHeight, targetWidthPoints, targetHeightPoints);

  // Calculate centered position for the cropped content
  const scaledCropWidth = cropWidth * scale;
  const scaledCropHeight = cropHeight * scale;
  const { x: centerX, y: centerY } = calculateCenteredPosition(
    scaledCropWidth,
    scaledCropHeight,
    targetWidthPoints,
    targetHeightPoints
  );

  // Draw the full page, but position it so that only the upper-left quadrant is visible
  // We need to draw the page scaled, but offset to show the upper-left part
  newPage.drawPage(embeddedPage, {
    x: centerX,  // Position so upper-left is visible
    y: centerY + scaledCropHeight - (pageHeight * scale), // Offset to show top part
    width: pageWidth * scale,
    height: pageHeight * scale,
  });

  // Save
  const outputPath = path.join(getTempDir(), `vinted_dpd_${Date.now()}.pdf`);
  const newPdfBytes = await newPdf.save();
  fs.writeFileSync(outputPath, newPdfBytes);

  console.log('[Vinted Profile] Saved DPD PDF:', outputPath);
  return outputPath;
}

/**
 * Process Hermes PDF using ImageMagick
 * Command: -gravity North -crop 100%x50%+0+0 -rotate -90 +repage
 */
async function processHermesPdf(inputPath: string): Promise<string> {
  console.log('[Vinted Profile] Processing Hermes PDF with ImageMagick');

  const { execSync } = await import('child_process');
  const tempImagePath = path.join(getTempDir(), `hermes_processed_${Date.now()}.png`);
  
  try {
    // Use ImageMagick to: convert PDF -> crop upper half -> rotate -90°
    const command = `magick -density ${TARGET_DPI} "${inputPath}[0]" -gravity North -crop 100%x50%+0+0 -rotate -90 +repage "${tempImagePath}"`;
    console.log('[Vinted Profile] Executing ImageMagick:', command);
    execSync(command);
    
    console.log('[Vinted Profile] ImageMagick processing complete');

    // Resize to target dimensions
    const targetDimensions = getTargetPixelDimensions();
    const { getContentHeightPixels } = await import('../utils');
    const contentHeight = getContentHeightPixels();

    const resizedImagePath = path.join(getTempDir(), `hermes_resized_${Date.now()}.png`);
    await sharp(tempImagePath)
      .resize(targetDimensions.width, contentHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(resizedImagePath);

    // Convert to PDF
    const targetWidthPoints = (targetDimensions.width * 72) / TARGET_DPI;
    const targetHeightPoints = (contentHeight * 72) / TARGET_DPI;

    const newPdf = await PDFDocument.create();
    const newPage = newPdf.addPage([targetWidthPoints, targetHeightPoints]);

    const imageBytes = fs.readFileSync(resizedImagePath);
    const pngImage = await newPdf.embedPng(imageBytes);

    newPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: targetWidthPoints,
      height: targetHeightPoints,
    });

    const outputPath = path.join(getTempDir(), `vinted_hermes_${Date.now()}.pdf`);
    const newPdfBytes = await newPdf.save();
    fs.writeFileSync(outputPath, newPdfBytes);

    // Cleanup
    fs.unlinkSync(tempImagePath);
    fs.unlinkSync(resizedImagePath);

    console.log('[Vinted Profile] Saved Hermes PDF:', outputPath);
    return outputPath;
  } catch (error) {
    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
    throw error;
  }
}

/**
 * Process standard PDF (GLS, DHL) using ImageMagick
 * Command: -gravity North -crop 100%x50%+0+0 -rotate -90 +repage
 */
async function processStandardPdf(inputPath: string): Promise<string> {
  console.log('[Vinted Profile] Processing standard PDF (GLS/DHL) with ImageMagick');

  const { execSync } = await import('child_process');
  const tempImagePath = path.join(getTempDir(), `standard_processed_${Date.now()}.png`);
  
  try {
    // Use ImageMagick to: convert PDF -> crop upper half -> rotate -90°
    const command = `magick -density ${TARGET_DPI} "${inputPath}[0]" -gravity North -crop 100%x50%+0+0 -rotate -90 +repage "${tempImagePath}"`;
    console.log('[Vinted Profile] Executing ImageMagick:', command);
    execSync(command);
    
    console.log('[Vinted Profile] ImageMagick processing complete');

    // Resize to target dimensions
    const targetDimensions = getTargetPixelDimensions();
    const { getContentHeightPixels } = await import('../utils');
    const contentHeight = getContentHeightPixels();

    const resizedImagePath = path.join(getTempDir(), `standard_resized_${Date.now()}.png`);
    await sharp(tempImagePath)
      .resize(targetDimensions.width, contentHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(resizedImagePath);

    // Convert to PDF
    const targetWidthPoints = (targetDimensions.width * 72) / TARGET_DPI;
    const targetHeightPoints = (contentHeight * 72) / TARGET_DPI;

    const newPdf = await PDFDocument.create();
    const newPage = newPdf.addPage([targetWidthPoints, targetHeightPoints]);

    const imageBytes = fs.readFileSync(resizedImagePath);
    const pngImage = await newPdf.embedPng(imageBytes);

    newPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: targetWidthPoints,
      height: targetHeightPoints,
    });

    const outputPath = path.join(getTempDir(), `vinted_standard_${Date.now()}.pdf`);
    const newPdfBytes = await newPdf.save();
    fs.writeFileSync(outputPath, newPdfBytes);

    // Cleanup
    fs.unlinkSync(tempImagePath);
    fs.unlinkSync(resizedImagePath);

    console.log('[Vinted Profile] Saved standard PDF:', outputPath);
    return outputPath;
  } catch (error) {
    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
    throw error;
  }
}

/**
 * Process DPD image: No rotation, crop to upper-left corner
 */
async function processDpdImage(inputPath: string): Promise<string> {
  console.log('[Vinted Profile] Processing DPD image (no rotation, crop upper-left)');

  let image = sharp(inputPath);
  const metadata = await image.metadata();

  console.log(`[Vinted Profile] Original image size: ${metadata.width}x${metadata.height}`);

  // Crop to upper-left corner
  const cropWidth = Math.floor((metadata.width || 0) / 2);
  const cropHeight = Math.floor((metadata.height || 0) / 2);

  console.log(`[Vinted Profile] Cropping to upper-left: ${cropWidth}x${cropHeight}px`);

  image = image.extract({
    left: 0,
    top: 0,
    width: cropWidth,
    height: cropHeight,
  });

  const targetDimensions = getTargetPixelDimensions();
  const { getContentHeightPixels } = await import('../utils');
  const contentHeight = getContentHeightPixels();

  // Resize to fit content area
  const outputPath = path.join(getTempDir(), `vinted_dpd_${Date.now()}.png`);

  await image
    .resize(targetDimensions.width, contentHeight, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toFile(outputPath);

  console.log('[Vinted Profile] Saved DPD image:', outputPath);
  return outputPath;
}

/**
 * Process Hermes image using ImageMagick
 * Command: -gravity North -crop 100%x50%+0+0 -rotate -90 +repage
 */
async function processHermesImage(inputPath: string): Promise<string> {
  console.log('[Vinted Profile] Processing Hermes image with ImageMagick');

  const { execSync } = await import('child_process');
  const tempImagePath = path.join(getTempDir(), `hermes_img_processed_${Date.now()}.png`);
  
  try {
    // Use ImageMagick to: crop upper half -> rotate -90°
    const command = `magick "${inputPath}" -gravity North -crop 100%x50%+0+0 -rotate -90 +repage "${tempImagePath}"`;
    console.log('[Vinted Profile] Executing ImageMagick:', command);
    execSync(command);
    
    console.log('[Vinted Profile] ImageMagick processing complete');

    // Resize to target dimensions
    const targetDimensions = getTargetPixelDimensions();
    const { getContentHeightPixels } = await import('../utils');
    const contentHeight = getContentHeightPixels();

    const outputPath = path.join(getTempDir(), `vinted_hermes_${Date.now()}.png`);
    await sharp(tempImagePath)
      .resize(targetDimensions.width, contentHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(outputPath);

    // Cleanup
    fs.unlinkSync(tempImagePath);

    console.log('[Vinted Profile] Saved Hermes image:', outputPath);
    return outputPath;
  } catch (error) {
    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
    throw error;
  }
}

/**
 * Process standard image (GLS, DHL) using ImageMagick
 * Command: -gravity North -crop 100%x50%+0+0 -rotate -90 +repage
 */
async function processStandardImage(inputPath: string): Promise<string> {
  console.log('[Vinted Profile] Processing standard image (GLS/DHL) with ImageMagick');

  const { execSync } = await import('child_process');
  const tempImagePath = path.join(getTempDir(), `standard_img_processed_${Date.now()}.png`);
  
  try {
    // Use ImageMagick to: crop upper half -> rotate -90°
    const command = `magick "${inputPath}" -gravity North -crop 100%x50%+0+0 -rotate -90 +repage "${tempImagePath}"`;
    console.log('[Vinted Profile] Executing ImageMagick:', command);
    execSync(command);
    
    console.log('[Vinted Profile] ImageMagick processing complete');

    // Resize to target dimensions
    const targetDimensions = getTargetPixelDimensions();
    const { getContentHeightPixels } = await import('../utils');
    const contentHeight = getContentHeightPixels();

    const outputPath = path.join(getTempDir(), `vinted_standard_${Date.now()}.png`);
    await sharp(tempImagePath)
      .resize(targetDimensions.width, contentHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(outputPath);

    // Cleanup
    fs.unlinkSync(tempImagePath);

    console.log('[Vinted Profile] Saved standard image:', outputPath);
    return outputPath;
  } catch (error) {
    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
    throw error;
  }
}

/**
 * Vinted profile implementation
 */
export const vintedProfile: LabelProfile = {
  id: 'vinted',
  name: 'Vinted Shipping Label',

  /**
   * Detect if this is a Vinted label
   */
  async detect(filePath: string, context?: ProfileContext): Promise<boolean> {
    // Check context first
    if (context?.platform?.toLowerCase() === 'vinted') {
      console.log('[Vinted Profile] Detected via platform context');
      return true;
    }

    // Check if shipping company is a known Vinted carrier
    const vintedCarriers = ['DHL', 'Hermes', 'GLS', 'DPD'];
    if (context?.shippingCompany && vintedCarriers.includes(context.shippingCompany)) {
      console.log(`[Vinted Profile] Detected via shipping company: ${context.shippingCompany}`);
      return true;
    }

    return false;
  },

  /**
   * Process Vinted label file based on carrier
   */
  async process(
    filePath: string,
    context?: ProfileContext
  ): Promise<{
    outputPath: string;
    width: number;
    height: number;
  }> {
    const shippingCompany = context?.shippingCompany || '';
    console.log(`[Vinted Profile] Processing label for: ${shippingCompany}`);
    
    const ext = path.extname(filePath).toLowerCase();
    let outputPath: string;

    // Route to carrier-specific processing
    if (shippingCompany === 'DPD') {
      // DPD: No rotation, crop upper-left
      if (ext === '.pdf') {
        outputPath = await processDpdPdf(filePath);
      } else {
        outputPath = await processDpdImage(filePath);
      }
    } else if (shippingCompany === 'Hermes') {
      // Hermes: Crop upper half, rotate 90° counter-clockwise
      if (ext === '.pdf') {
        outputPath = await processHermesPdf(filePath);
      } else {
        outputPath = await processHermesImage(filePath);
      }
    } else {
      // GLS, DHL: Crop upper half, rotate 90° counter-clockwise
      if (ext === '.pdf') {
        outputPath = await processStandardPdf(filePath);
      } else {
        outputPath = await processStandardImage(filePath);
      }
    }

    return {
      outputPath,
      width: TARGET_SIZE_MM.width,
      height: TARGET_SIZE_MM.height,
    };
  },
};
