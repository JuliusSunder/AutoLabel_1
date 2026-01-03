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
import { execSync } from 'node:child_process';
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
import { logToRenderer, warnToRenderer, errorToRenderer } from '../../utils/renderer-logger';

/**
 * Node.js Canvas Factory for PDF.js
 * Provides a canvas implementation that works in Node.js environment
 */
const NodeCanvasFactory = {
  create(width: number, height: number) {
    // Dynamic import to avoid issues if canvas is not available
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(width, height);
    return {
      canvas,
      context: canvas.getContext('2d'),
    };
  },
  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  },
  destroy(canvasAndContext: any) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  },
};

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
 * Find ImageMagick executable
 * Searches in bundled app directory and common installation paths
 */
function findImageMagick(): string | null {
  logToRenderer('[Vinted Profile] 🔍 Searching for ImageMagick...');
  logToRenderer('[Vinted Profile] process.resourcesPath:', process.resourcesPath);
  logToRenderer('[Vinted Profile] app.getAppPath():', app.getAppPath());
  logToRenderer('[Vinted Profile] process.cwd():', process.cwd());
  
  const possiblePaths = [
    // Bundled with app (primary location for packaged builds)
    // IMPORTANT: process.resourcesPath must be checked FIRST for production builds
    // extraResource copies to resources/ImageMagick/ (not resources/bin/ImageMagick/)
    path.join(process.resourcesPath || '', 'ImageMagick', 'magick.exe'),
    // Development paths (when running from source)
    path.join(app.getAppPath(), 'bin', 'ImageMagick', 'magick.exe'),
    path.join(process.cwd(), 'app', 'bin', 'ImageMagick', 'magick.exe'),
    // System installations (fallback)
    'C:\\Program Files\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe',
    'C:\\Program Files\\ImageMagick-7.1.0-Q16-HDRI\\magick.exe',
    'C:\\Program Files (x86)\\ImageMagick-7.1.1-Q16-HDRI\\magick.exe',
    'C:\\Program Files (x86)\\ImageMagick-7.1.0-Q16-HDRI\\magick.exe',
  ];

  // Check all possible paths
  for (const magickPath of possiblePaths) {
    logToRenderer(`[Vinted Profile] Checking: ${magickPath}`);
    
    // Skip ASAR paths - executables cannot be run from inside ASAR
    if (magickPath.includes('.asar')) {
      logToRenderer(`[Vinted Profile] ⚠️ Skipping ASAR path (executables must be unpacked): ${magickPath}`);
      continue;
    }
    
    if (fs.existsSync(magickPath)) {
      logToRenderer(`[Vinted Profile] ✅ Found ImageMagick at: ${magickPath}`);
      return magickPath;
    } else {
      logToRenderer(`[Vinted Profile] ❌ Not found at: ${magickPath}`);
    }
  }

  // Try to find in PATH
  try {
    execSync('where magick.exe', { encoding: 'utf-8', windowsHide: true });
    logToRenderer('[Vinted Profile] ✅ Found ImageMagick in system PATH');
    return 'magick.exe';
  } catch {
    // Not in PATH
  }

  errorToRenderer('[Vinted Profile] ❌ ImageMagick not found in any standard location');
  errorToRenderer('[Vinted Profile] Searched paths:', possiblePaths);
  return null;
}

/**
 * Find Ghostscript executable
 * Ghostscript is required by ImageMagick for PDF processing
 * Returns the bin directory path (not the executable itself)
 */
function findGhostscript(): string | null {
  logToRenderer('[Vinted Profile] 🔍 Searching for Ghostscript...');
  
  const possiblePaths = [
    // Bundled with app (primary location for packaged builds)
    path.join(process.resourcesPath || '', 'Ghostscript', 'bin', 'gswin64c.exe'),
    // Development paths (when running from source)
    path.join(app.getAppPath(), 'bin', 'Ghostscript', 'bin', 'gswin64c.exe'),
    path.join(process.cwd(), 'app', 'bin', 'Ghostscript', 'bin', 'gswin64c.exe'),
    // System installations (fallback)
    'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.05.0\\bin\\gswin64c.exe',
    'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
  ];

  for (const gsPath of possiblePaths) {
    // Skip ASAR paths
    if (gsPath.includes('.asar')) {
      continue;
    }
    
    if (fs.existsSync(gsPath)) {
      const binDir = path.dirname(gsPath);
      logToRenderer(`[Vinted Profile] ✅ Found Ghostscript at: ${binDir}`);
      return binDir;
    }
  }

  logToRenderer('[Vinted Profile] ⚠️ Ghostscript not found (PDF processing may fail)');
  return null;
}

/**
 * Verify Ghostscript installation by checking for required files
 * Returns true if all required files exist
 */
function verifyGhostscriptInstallation(gsBinPath: string): boolean {
  const gsExePath = path.join(gsBinPath, 'gswin64c.exe');
  const gsDllPath = path.join(gsBinPath, 'gsdll64.dll');
  
  if (!fs.existsSync(gsExePath)) {
    errorToRenderer('[Vinted Profile] ❌ gswin64c.exe not found at:', gsExePath);
    return false;
  }
  
  if (!fs.existsSync(gsDllPath)) {
    errorToRenderer('[Vinted Profile] ❌ gsdll64.dll not found at:', gsDllPath);
    return false;
  }
  
  logToRenderer('[Vinted Profile] ✅ Ghostscript installation verified');
  logToRenderer('[Vinted Profile] - gswin64c.exe:', gsExePath);
  logToRenderer('[Vinted Profile] - gsdll64.dll:', gsDllPath);
  
  return true;
}

/**
 * Fix ImageMagick delegates.xml to use correct Ghostscript path
 * The portable ImageMagick version has @PSDelegate@ placeholder that needs to be replaced
 * Returns path to the directory containing the fixed config files
 */
function fixImageMagickDelegates(gsExePath: string): string | null {
  try {
    logToRenderer('[Vinted Profile] 🔧 Fixing ImageMagick delegates.xml...');
    
    // Find ImageMagick directory
    const magickPath = findImageMagick();
    if (!magickPath) {
      return null;
    }
    
    const magickDir = path.dirname(magickPath);
    const originalDelegatesPath = path.join(magickDir, 'delegates.xml');
    
    // Check if delegates.xml exists
    if (!fs.existsSync(originalDelegatesPath)) {
      logToRenderer('[Vinted Profile] ⚠️ delegates.xml not found at:', originalDelegatesPath);
      return null;
    }
    
    // Read original delegates.xml
    let delegatesContent = fs.readFileSync(originalDelegatesPath, 'utf-8');
    
    // Check if it needs fixing (contains @PSDelegate@ placeholder)
    if (!delegatesContent.includes('@PSDelegate@')) {
      logToRenderer('[Vinted Profile] ✅ delegates.xml already configured correctly');
      // Return the original ImageMagick directory since no fix is needed
      return magickDir;
    }
    
    // Replace @PSDelegate@ with actual Ghostscript path
    // Use forward slashes for XML (ImageMagick handles both)
    const gsPathForXml = gsExePath.replace(/\\/g, '/');
    delegatesContent = delegatesContent.replace(/@PSDelegate@/g, gsPathForXml);
    
    // Create config directory in temp
    const tempDir = getTempDir();
    const configDir = path.join(tempDir, 'magick-config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write fixed delegates.xml
    const fixedDelegatesPath = path.join(configDir, 'delegates.xml');
    fs.writeFileSync(fixedDelegatesPath, delegatesContent, 'utf-8');
    logToRenderer('[Vinted Profile] ✅ Fixed delegates.xml saved to:', fixedDelegatesPath);
    
    // Copy other essential config files from ImageMagick directory
    // This ensures ImageMagick can find all its configuration
    const configFiles = ['policy.xml', 'type.xml', 'colors.xml'];
    for (const configFile of configFiles) {
      const srcPath = path.join(magickDir, configFile);
      const dstPath = path.join(configDir, configFile);
      if (fs.existsSync(srcPath) && !fs.existsSync(dstPath)) {
        fs.copyFileSync(srcPath, dstPath);
        logToRenderer(`[Vinted Profile] Copied ${configFile} to config directory`);
      }
    }
    
    return configDir;
    
  } catch (error) {
    errorToRenderer('[Vinted Profile] ❌ Failed to fix delegates.xml:', error);
    return null;
  }
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

    logToRenderer('[Vinted Profile] Saved DPD PDF:', outputPath);
  return outputPath;
}

/**
 * Render PDF to PNG using PDF.js (pure JavaScript, no external binaries)
 * Returns path to rendered PNG file
 */
async function renderPdfToPngWithPdfJs(
  pdfPath: string,
  outputPngPath: string,
  dpi: number = 300
): Promise<void> {
  logToRenderer('[Vinted Profile] Rendering PDF to PNG with PDF.js...');
  
  try {
    // Import PDF.js
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
    logToRenderer(`[Vinted Profile] PDF.js loaded document with ${pdfDocument.numPages} pages`);
    
    // Get first page
    const page = await pdfDocument.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Calculate scale for desired DPI
    // PDF.js viewport is in 72 DPI, so scale = desiredDPI / 72
    const scale = dpi / 72;
    const scaledViewport = page.getViewport({ scale });
    
    logToRenderer(`[Vinted Profile] Rendering at ${dpi} DPI, scale: ${scale}, size: ${Math.floor(scaledViewport.width)}x${Math.floor(scaledViewport.height)}`);
    
    // Create canvas using NodeCanvasFactory
    const canvasFactory = NodeCanvasFactory.create(
      Math.floor(scaledViewport.width),
      Math.floor(scaledViewport.height)
    );
    
    // Render page to canvas
    const renderContext = {
      canvasContext: canvasFactory.context,
      viewport: scaledViewport,
    };
    
    await page.render(renderContext).promise;
    logToRenderer('[Vinted Profile] PDF.js rendering complete');
    
    // Save canvas to PNG file
    const buffer = canvasFactory.canvas.toBuffer('image/png');
    fs.writeFileSync(outputPngPath, buffer);
    
    logToRenderer(`[Vinted Profile] ✅ PDF rendered to PNG: ${outputPngPath}`);
    
    // Cleanup
    NodeCanvasFactory.destroy(canvasFactory);
    await pdfDocument.destroy();
  } catch (error: any) {
    errorToRenderer('[Vinted Profile] ❌ PDF.js rendering failed:', error.message);
    if (error.stack) {
      errorToRenderer('[Vinted Profile] Stack trace:', error.stack);
    }
    throw error;
  }
}

/**
 * Render PDF to PNG with automatic fallback
 * Tries Ghostscript first, falls back to PDF.js if it fails
 */
async function renderPdfToPng(
  pdfPath: string,
  outputPngPath: string,
  dpi: number = 300
): Promise<void> {
  const gsBinPath = findGhostscript();
  
  // Try Ghostscript if available
  if (gsBinPath && verifyGhostscriptInstallation(gsBinPath)) {
    try {
      const gsExePath = path.resolve(gsBinPath, 'gswin64c.exe');
      const gsDllPath = path.resolve(gsBinPath, 'gsdll64.dll');
      
      // Set up Ghostscript environment
      const env = { ...process.env };
      env.PATH = `${gsBinPath}${path.delimiter}${env.PATH || ''}`;
      
      const gsLibPath = path.join(path.dirname(gsBinPath), 'lib');
      if (fs.existsSync(gsLibPath)) {
        env.GS_LIB = gsLibPath;
        logToRenderer('[Vinted Profile] Set GS_LIB:', gsLibPath);
      }
      
      // Log directory contents for debugging
      try {
        const binContents = fs.readdirSync(gsBinPath);
        logToRenderer('[Vinted Profile] Ghostscript bin contents:', binContents.slice(0, 10).join(', '));
        logToRenderer('[Vinted Profile] Ghostscript lib exists:', fs.existsSync(gsLibPath));
      } catch (e) {
        // Ignore directory listing errors
      }
      
      const gsCommand = `"${gsExePath}" -dNOPAUSE -dBATCH -sDEVICE=png16m -r${dpi} -dFirstPage=1 -dLastPage=1 -sOutputFile="${outputPngPath}" "${pdfPath}"`;
      logToRenderer('[Vinted Profile] Executing Ghostscript:', gsCommand);
      
      execSync(gsCommand, { 
        windowsHide: true,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        cwd: gsBinPath  // IMPORTANT: Set working directory to Ghostscript bin
      });
      
      // Verify output was created
      if (fs.existsSync(outputPngPath)) {
        logToRenderer('[Vinted Profile] ✅ Ghostscript rendered PDF successfully');
        return;
      } else {
        throw new Error('Ghostscript did not create output file');
      }
    } catch (error: any) {
      logToRenderer('[Vinted Profile] ⚠️ Ghostscript failed, falling back to PDF.js');
      logToRenderer('[Vinted Profile] Error:', error.message);
      if (error.status) {
        errorToRenderer('[Vinted Profile] Exit code:', error.status);
      }
      if (error.stderr) {
        errorToRenderer('[Vinted Profile] Stderr:', error.stderr);
      }
    }
  } else {
    logToRenderer('[Vinted Profile] Ghostscript not available, using PDF.js');
  }
  
  // Fallback to PDF.js
  logToRenderer('[Vinted Profile] Using PDF.js for PDF rendering');
  await renderPdfToPngWithPdfJs(pdfPath, outputPngPath, dpi);
}

/**
 * Process Hermes PDF using Ghostscript + Sharp (direct approach)
 * Strategy: Use Ghostscript to render PDF to PNG, then crop and rotate with Sharp
 */
async function processHermesPdf(inputPath: string): Promise<string> {
  logToRenderer('[Vinted Profile] 🔄 Processing Hermes PDF');

  const tempPngPath = path.join(getTempDir(), `hermes_${Date.now()}.png`);
  
  try {
    // Step 1: Render PDF to PNG (with automatic fallback)
    await renderPdfToPng(inputPath, tempPngPath, TARGET_DPI);
    
    logToRenderer('[Vinted Profile] ✅ PDF rendered to PNG');

    // Step 2: Load image with Sharp and get dimensions
    const metadata = await sharp(tempPngPath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    
    logToRenderer(`[Vinted Profile] Original PNG size: ${width}x${height}px`);

    // Step 3: Crop upper half (North gravity, 100%x50%)
    const cropHeight = Math.floor(height / 2);
    const croppedImagePath = path.join(getTempDir(), `hermes_cropped_${Date.now()}.png`);
    
    await sharp(tempPngPath)
      .extract({
        left: 0,
        top: 0,
        width: width,
        height: cropHeight
      })
      .toFile(croppedImagePath);
    
    logToRenderer(`[Vinted Profile] Cropped to upper half: ${width}x${cropHeight}px`);

    // Step 4: Rotate -90° (counter-clockwise)
    const rotatedImagePath = path.join(getTempDir(), `hermes_rotated_${Date.now()}.png`);
    
    await sharp(croppedImagePath)
      .rotate(-90)
      .toFile(rotatedImagePath);
    
    logToRenderer('[Vinted Profile] Rotated -90°');

    // Step 5: Resize to target dimensions
    const targetDimensions = getTargetPixelDimensions();
    const { getContentHeightPixels } = await import('../utils');
    const contentHeight = getContentHeightPixels();

    const resizedImagePath = path.join(getTempDir(), `hermes_resized_${Date.now()}.png`);
    await sharp(rotatedImagePath)
      .resize(targetDimensions.width, contentHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(resizedImagePath);
    
    logToRenderer('[Vinted Profile] Resized to target dimensions');

    // Step 6: Convert to PDF
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
    fs.unlinkSync(tempPngPath);
    fs.unlinkSync(croppedImagePath);
    fs.unlinkSync(rotatedImagePath);
    fs.unlinkSync(resizedImagePath);

    logToRenderer('[Vinted Profile] ✅ Saved Hermes PDF:', outputPath);
    return outputPath;
  } catch (error: any) {
    // Log detailed error information
    errorToRenderer('[Vinted Profile] ❌ PDF processing failed!');
    errorToRenderer('[Vinted Profile] Error message:', error.message);
    
    if (error.stderr) {
      errorToRenderer('[Vinted Profile] Stderr:', error.stderr);
    }
    if (error.stdout) {
      logToRenderer('[Vinted Profile] Stdout:', error.stdout);
    }
    if (error.status) {
      errorToRenderer('[Vinted Profile] Exit code:', error.status);
    }
    
    // Cleanup temp files
    try {
      if (fs.existsSync(tempPngPath)) fs.unlinkSync(tempPngPath);
      if (typeof croppedImagePath !== 'undefined' && fs.existsSync(croppedImagePath)) fs.unlinkSync(croppedImagePath);
      if (typeof rotatedImagePath !== 'undefined' && fs.existsSync(rotatedImagePath)) fs.unlinkSync(rotatedImagePath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    // Re-throw with more context
    throw new Error(`PDF processing failed: ${error.message}${error.stderr ? '\nStderr: ' + error.stderr : ''}`);
  }
}

/**
 * Process standard PDF (GLS, DHL) using Ghostscript + Sharp (direct approach)
 * Strategy: Use Ghostscript to render PDF to PNG, then crop and rotate with Sharp
 */
async function processStandardPdf(inputPath: string): Promise<string> {
  logToRenderer('[Vinted Profile] 🔄 Processing standard PDF (GLS/DHL)');

  const tempPngPath = path.join(getTempDir(), `standard_${Date.now()}.png`);
  
  try {
    // Step 1: Render PDF to PNG (with automatic fallback)
    await renderPdfToPng(inputPath, tempPngPath, TARGET_DPI);
    
    logToRenderer('[Vinted Profile] ✅ PDF rendered to PNG');

    // Step 2: Load image with Sharp and get dimensions
    const metadata = await sharp(tempPngPath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    
    logToRenderer(`[Vinted Profile] Original PNG size: ${width}x${height}px`);

    // Step 3: Crop upper half (North gravity, 100%x50%)
    const cropHeight = Math.floor(height / 2);
    const croppedImagePath = path.join(getTempDir(), `standard_cropped_${Date.now()}.png`);
    
    await sharp(tempPngPath)
      .extract({
        left: 0,
        top: 0,
        width: width,
        height: cropHeight
      })
      .toFile(croppedImagePath);
    
    logToRenderer(`[Vinted Profile] Cropped to upper half: ${width}x${cropHeight}px`);

    // Step 4: Rotate -90° (counter-clockwise)
    const rotatedImagePath = path.join(getTempDir(), `standard_rotated_${Date.now()}.png`);
    
    await sharp(croppedImagePath)
      .rotate(-90)
      .toFile(rotatedImagePath);
    
    logToRenderer('[Vinted Profile] Rotated -90°');

    // Step 5: Resize to target dimensions
    const targetDimensions = getTargetPixelDimensions();
    const { getContentHeightPixels } = await import('../utils');
    const contentHeight = getContentHeightPixels();

    const resizedImagePath = path.join(getTempDir(), `standard_resized_${Date.now()}.png`);
    await sharp(rotatedImagePath)
      .resize(targetDimensions.width, contentHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(resizedImagePath);
    
    logToRenderer('[Vinted Profile] Resized to target dimensions');

    // Step 6: Convert to PDF
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
    fs.unlinkSync(tempPngPath);
    fs.unlinkSync(croppedImagePath);
    fs.unlinkSync(rotatedImagePath);
    fs.unlinkSync(resizedImagePath);

    logToRenderer('[Vinted Profile] ✅ Saved standard PDF:', outputPath);
    return outputPath;
  } catch (error: any) {
    // Log detailed error information
    errorToRenderer('[Vinted Profile] ❌ PDF processing failed!');
    errorToRenderer('[Vinted Profile] Error message:', error.message);
    
    if (error.stderr) {
      errorToRenderer('[Vinted Profile] Stderr:', error.stderr);
    }
    if (error.stdout) {
      logToRenderer('[Vinted Profile] Stdout:', error.stdout);
    }
    if (error.status) {
      errorToRenderer('[Vinted Profile] Exit code:', error.status);
    }
    
    // Cleanup temp files
    try {
      if (fs.existsSync(tempPngPath)) fs.unlinkSync(tempPngPath);
      if (typeof croppedImagePath !== 'undefined' && fs.existsSync(croppedImagePath)) fs.unlinkSync(croppedImagePath);
      if (typeof rotatedImagePath !== 'undefined' && fs.existsSync(rotatedImagePath)) fs.unlinkSync(rotatedImagePath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    // Re-throw with more context
    throw new Error(`PDF processing failed: ${error.message}${error.stderr ? '\nStderr: ' + error.stderr : ''}`);
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
  logToRenderer('[Vinted Profile] 🔄 Processing Hermes image with ImageMagick');

  // Find ImageMagick executable
  const magickPath = findImageMagick();
  if (!magickPath) {
    const errorMsg = 'ImageMagick nicht gefunden. Hermes-Labels können nicht verarbeitet werden. ' +
      'Bitte installieren Sie ImageMagick oder kontaktieren Sie den Support.';
    errorToRenderer('[Vinted Profile] ❌', errorMsg);
    throw new Error(errorMsg);
  }
  
  logToRenderer('[Vinted Profile] Using ImageMagick at:', magickPath);

  const tempImagePath = path.join(getTempDir(), `hermes_img_processed_${Date.now()}.png`);
  
  try {
    // Use ImageMagick to: crop upper half -> rotate -90°
    const command = `"${magickPath}" "${inputPath}" -gravity North -crop 100%x50%+0+0 -rotate -90 +repage "${tempImagePath}"`;
    console.log('[Vinted Profile] Executing ImageMagick:', command);
    execSync(command, { windowsHide: true });
    
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

    logToRenderer('[Vinted Profile] Saved Hermes image:', outputPath);
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
  logToRenderer('[Vinted Profile] 🔄 Processing standard image (GLS/DHL) with ImageMagick');

  // Find ImageMagick executable
  const magickPath = findImageMagick();
  if (!magickPath) {
    const errorMsg = 'ImageMagick nicht gefunden. GLS/DHL-Labels können nicht verarbeitet werden. ' +
      'Bitte installieren Sie ImageMagick oder kontaktieren Sie den Support.';
    errorToRenderer('[Vinted Profile] ❌', errorMsg);
    throw new Error(errorMsg);
  }
  
  logToRenderer('[Vinted Profile] Using ImageMagick at:', magickPath);

  const tempImagePath = path.join(getTempDir(), `standard_img_processed_${Date.now()}.png`);
  
  try {
    // Use ImageMagick to: crop upper half -> rotate -90°
    const command = `"${magickPath}" "${inputPath}" -gravity North -crop 100%x50%+0+0 -rotate -90 +repage "${tempImagePath}"`;
    console.log('[Vinted Profile] Executing ImageMagick:', command);
    execSync(command, { windowsHide: true });
    
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

    logToRenderer('[Vinted Profile] Saved standard image:', outputPath);
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
    logToRenderer(`[Vinted Profile] Processing label for: ${shippingCompany}`);
    
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
