/**
 * Footer Renderer
 * Adds metadata footer to labels
 */

import sharp from 'sharp';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';
import type { Sale, FooterConfig } from '../../shared/types';
import { getFooterHeightPixels, getTargetPixelDimensions } from './utils';

/**
 * Generate footer text from sale data and config
 */
function generateFooterText(sale: Sale, config: FooterConfig): string {
  const parts: string[] = [];

  if (config.includeProductNumber) {
    parts.push(sale.productNumber ? `#${sale.productNumber}` : 'No Product Number');
  }

  if (config.includeItemTitle) {
    parts.push(sale.itemTitle ? sale.itemTitle.substring(0, 40) : 'No Item Title');
  }

  if (config.includeDate) {
    const date = new Date(sale.date);
    parts.push(date.toLocaleDateString('de-DE'));
  }

  return parts.join(' | ');
}

/**
 * Add footer to PDF label
 * 
 * Strategy: Convert PDF to image, add footer as image, then convert back to PDF
 * This avoids issues with PDF embedding and ensures consistent rendering
 */
export async function addFooterToPdf(
  inputPath: string,
  outputPath: string,
  sale: Sale,
  config: FooterConfig
): Promise<void> {
  console.log('[Footer] Adding footer to PDF:', inputPath);

  // Convert PDF to high-resolution PNG first
  const dimensions = getTargetPixelDimensions();
  const footerHeight = getFooterHeightPixels();
  const contentHeight = dimensions.height - footerHeight;

  // Use pdf-to-img or similar to convert PDF page to image
  // For now, use the same approach as images
  const tempImagePath = inputPath.replace('.pdf', '_temp.png');
  
  try {
    // Convert PDF to PNG using pdf-lib + canvas or sharp
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(0);
    const { width: pdfWidth, height: pdfHeight } = page.getSize();
    
    console.log(`[Footer] Original PDF size: ${pdfWidth}x${pdfHeight} points`);
    
    // Calculate pixel dimensions (PDF points are 72 DPI, we want 300 DPI)
    const scale = 300 / 72;
    const imageWidth = Math.round(pdfWidth * scale);
    const imageHeight = Math.round(pdfHeight * scale);
    
    console.log(`[Footer] Converting to image: ${imageWidth}x${imageHeight} pixels`);
    
    // For MVP: Use the image approach directly
    // This means we treat the PDF as if it were already an image
    // The caller should have already normalized it to the right size
    
    // Generate footer text
    const footerText = generateFooterText(sale, config);

    // Create footer as SVG
    const footerSvg = `
      <svg width="${dimensions.width}" height="${footerHeight}">
        <text 
          x="${dimensions.width / 2}" 
          y="${footerHeight / 2 + 4}" 
          font-family="Arial, sans-serif" 
          font-size="20" 
          fill="black" 
          text-anchor="middle"
        >${footerText}</text>
      </svg>
    `;

    // Load PDF as image buffer (this requires pdf-to-png conversion)
    // For now, we'll create a composite with the PDF embedded as image
    const targetWidthPoints = (dimensions.width * 72) / 300;
    const targetHeightPoints = (dimensions.height * 72) / 300;
    const footerHeightPoints = (footerHeight * 72) / 300;

    // Create new PDF with footer space
    const newDoc = await PDFDocument.create();
    const newPage = newDoc.addPage([targetWidthPoints, targetHeightPoints]);

    // Draw white background
    newPage.drawRectangle({
      x: 0,
      y: 0,
      width: targetWidthPoints,
      height: targetHeightPoints,
      color: rgb(1, 1, 1),
    });

    // Embed original PDF page at the top
    const originalDoc = await PDFDocument.load(pdfBytes);
    const originalPage = originalDoc.getPage(0);
    const { width: origWidth, height: origHeight } = originalPage.getSize();
    
    const contentHeightPoints = targetHeightPoints - footerHeightPoints;
    
    console.log(`[Footer] Original page size: ${origWidth}x${origHeight} points`);
    console.log(`[Footer] Target content area: ${targetWidthPoints}x${contentHeightPoints} points`);
    console.log(`[Footer] Footer height: ${footerHeightPoints} points`);
    console.log(`[Footer] New total page height: ${targetHeightPoints} points`);
    
    const [embeddedPage] = await newDoc.embedPdf(originalDoc, [0]);
    
    // IMPORTANT: The original page should fit ONLY in the content area (not overflow into footer)
    // The original PDF was already normalized to contentHeight by the profile
    // Draw it at its original size (no scaling), just position it above the footer
    console.log(`[Footer] Drawing embedded page at position (0, ${footerHeightPoints})`);
    
    newPage.drawPage(embeddedPage, {
      x: 0,
      y: footerHeightPoints,
      // Don't specify width/height - let it use original dimensions
    });

    // Draw footer text
    const font = await newDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 8;
    const textWidth = font.widthOfTextAtSize(footerText, fontSize);
    const textX = (targetWidthPoints - textWidth) / 2;
    const textY = footerHeightPoints / 2 - fontSize / 2;

    newPage.drawText(footerText, {
      x: textX,
      y: textY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    // Save
    const newPdfBytes = await newDoc.save();
    fs.writeFileSync(outputPath, newPdfBytes);

    console.log('[Footer] Saved PDF with footer:', outputPath);
  } catch (error) {
    console.error('[Footer] Error adding footer to PDF:', error);
    throw error;
  }
}

/**
 * Add footer to image label
 */
export async function addFooterToImage(
  inputPath: string,
  outputPath: string,
  sale: Sale,
  config: FooterConfig
): Promise<void> {
  console.log('[Footer] Adding footer to image:', inputPath);

  const dimensions = getTargetPixelDimensions();
  const footerHeight = getFooterHeightPixels();

  // Generate footer text
  const footerText = generateFooterText(sale, config);

  // Create footer as SVG (black text, no background)
  const footerSvg = `
    <svg width="${dimensions.width}" height="${footerHeight}">
      <text 
        x="${dimensions.width / 2}" 
        y="${footerHeight / 2 + 4}" 
        font-family="Arial, sans-serif" 
        font-size="20" 
        fill="black" 
        text-anchor="middle"
      >${footerText}</text>
    </svg>
  `;

  // Load input image
  const inputImage = sharp(inputPath);
  const inputMetadata = await inputImage.metadata();

  // If image is not at target size, resize it first
  let processedImage = inputImage;
  if (
    inputMetadata.width !== dimensions.width ||
    inputMetadata.height !== dimensions.height - footerHeight
  ) {
    processedImage = inputImage.resize(
      dimensions.width,
      dimensions.height - footerHeight,
      {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      }
    );
  }

  // Composite: stack image on top of footer
  await sharp({
    create: {
      width: dimensions.width,
      height: dimensions.height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: await processedImage.png().toBuffer(),
        top: 0,
        left: 0,
      },
      {
        input: Buffer.from(footerSvg),
        top: dimensions.height - footerHeight,
        left: 0,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log('[Footer] Saved image with footer:', outputPath);
}

/**
 * Add footer to label (auto-detects PDF vs image)
 */
export async function addFooter(
  inputPath: string,
  outputPath: string,
  sale: Sale,
  config: FooterConfig
): Promise<void> {
  const ext = path.extname(inputPath).toLowerCase();

  if (ext === '.pdf') {
    await addFooterToPdf(inputPath, outputPath, sale, config);
  } else {
    await addFooterToImage(inputPath, outputPath, sale, config);
  }
}
