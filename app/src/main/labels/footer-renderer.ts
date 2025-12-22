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
 */
export async function addFooterToPdf(
  inputPath: string,
  outputPath: string,
  sale: Sale,
  config: FooterConfig
): Promise<void> {
  console.log('[Footer] Adding footer to PDF:', inputPath);

  // Load PDF
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Get first page
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();

  // Calculate footer dimensions
  const footerHeight = getFooterHeightPixels() * (72 / 300); // Convert from 300 DPI to PDF points (72 DPI)

  // Generate footer text
  const footerText = generateFooterText(sale, config);

  // Embed font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 8;

  // Draw footer background (dark bar)
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: footerHeight,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Draw footer text (white on dark)
  const textWidth = font.widthOfTextAtSize(footerText, fontSize);
  const textX = (width - textWidth) / 2; // Center text
  const textY = footerHeight / 2 - fontSize / 2; // Vertically center in footer

  page.drawText(footerText, {
    x: textX,
    y: textY,
    size: fontSize,
    font,
    color: rgb(1, 1, 1), // White
  });

  // Save
  const newPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, newPdfBytes);

  console.log('[Footer] Saved PDF with footer:', outputPath);
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

  // Create footer as SVG (simple text on dark background)
  const footerSvg = `
    <svg width="${dimensions.width}" height="${footerHeight}">
      <rect width="${dimensions.width}" height="${footerHeight}" fill="#333"/>
      <text 
        x="${dimensions.width / 2}" 
        y="${footerHeight / 2 + 4}" 
        font-family="Arial, sans-serif" 
        font-size="20" 
        fill="white" 
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
