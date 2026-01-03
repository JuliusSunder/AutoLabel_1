/**
 * PDF Thumbnail Generator
 * Generates small image previews of PDF labels for UI display
 */

import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { Canvas, createCanvas } from 'canvas';
import { logToRenderer, warnToRenderer, errorToRenderer } from '../utils/renderer-logger';

const execAsync = promisify(exec);

/**
 * Find ImageMagick executable
 * Searches in bundled app directory and common installation paths
 */
function findImageMagick(): string | null {
  logToRenderer('[Thumbnail] 🔍 Searching for ImageMagick...');
  logToRenderer('[Thumbnail] process.resourcesPath:', process.resourcesPath);
  logToRenderer('[Thumbnail] app.getAppPath():', app.getAppPath());
  logToRenderer('[Thumbnail] process.cwd():', process.cwd());
  
  const possiblePaths = [
    // Bundled with app (primary location for packaged builds)
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

  for (const magickPath of possiblePaths) {
    logToRenderer(`[Thumbnail] Checking: ${magickPath}`);
    
    // Skip ASAR paths - executables cannot be run from inside ASAR
    if (magickPath.includes('.asar')) {
      logToRenderer(`[Thumbnail] ⚠️ Skipping ASAR path (executables must be unpacked): ${magickPath}`);
      continue;
    }
    
    if (fs.existsSync(magickPath)) {
      logToRenderer(`[Thumbnail] ✅ Found ImageMagick at: ${magickPath}`);
      return magickPath;
    } else {
      logToRenderer(`[Thumbnail] ❌ Not found at: ${magickPath}`);
    }
  }

  // Try to find in PATH
  try {
    execSync('where magick.exe', { encoding: 'utf-8', windowsHide: true });
    logToRenderer('[Thumbnail] ✅ Found ImageMagick in system PATH');
    return 'magick.exe';
  } catch {
    // Not in PATH
  }

  errorToRenderer('[Thumbnail] ❌ ImageMagick not found in any location');
  errorToRenderer('[Thumbnail] Searched paths:', possiblePaths);
  return null;
}

/**
 * Find Ghostscript executable
 * Ghostscript is required by ImageMagick for PDF processing
 * Returns the bin directory path (not the executable itself)
 */
function findGhostscript(): string | null {
  logToRenderer('[Thumbnail] 🔍 Searching for Ghostscript...');
  
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
      logToRenderer(`[Thumbnail] ✅ Found Ghostscript at: ${binDir}`);
      return binDir;
    }
  }

  logToRenderer('[Thumbnail] ⚠️ Ghostscript not found (PDF processing may fail)');
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
    errorToRenderer('[Thumbnail] ❌ gswin64c.exe not found at:', gsExePath);
    return false;
  }
  
  if (!fs.existsSync(gsDllPath)) {
    errorToRenderer('[Thumbnail] ❌ gsdll64.dll not found at:', gsDllPath);
    return false;
  }
  
  logToRenderer('[Thumbnail] ✅ Ghostscript installation verified');
  return true;
}

/**
 * Fix ImageMagick delegates.xml to use correct Ghostscript path
 * The portable ImageMagick version has @PSDelegate@ placeholder that needs to be replaced
 * Returns path to the directory containing the fixed config files
 */
function fixImageMagickDelegates(gsExePath: string): string | null {
  try {
    logToRenderer('[Thumbnail] 🔧 Fixing ImageMagick delegates.xml...');
    
    // Find ImageMagick directory
    const magickPath = findImageMagick();
    if (!magickPath) {
      return null;
    }
    
    const magickDir = path.dirname(magickPath);
    const originalDelegatesPath = path.join(magickDir, 'delegates.xml');
    
    // Check if delegates.xml exists
    if (!fs.existsSync(originalDelegatesPath)) {
      logToRenderer('[Thumbnail] ⚠️ delegates.xml not found at:', originalDelegatesPath);
      return null;
    }
    
    // Read original delegates.xml
    let delegatesContent = fs.readFileSync(originalDelegatesPath, 'utf-8');
    
    // Check if it needs fixing (contains @PSDelegate@ placeholder)
    if (!delegatesContent.includes('@PSDelegate@')) {
      logToRenderer('[Thumbnail] ✅ delegates.xml already configured correctly');
      // Return the original ImageMagick directory since no fix is needed
      return magickDir;
    }
    
    // Replace @PSDelegate@ with actual Ghostscript path
    // Use forward slashes for XML (ImageMagick handles both)
    const gsPathForXml = gsExePath.replace(/\\/g, '/');
    delegatesContent = delegatesContent.replace(/@PSDelegate@/g, gsPathForXml);
    
    // Create config directory in temp
    const userDataPath = app.getPath('userData');
    const tempDir = path.join(userDataPath, 'temp-thumbnails');
    const configDir = path.join(tempDir, 'magick-config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write fixed delegates.xml
    const fixedDelegatesPath = path.join(configDir, 'delegates.xml');
    fs.writeFileSync(fixedDelegatesPath, delegatesContent, 'utf-8');
    logToRenderer('[Thumbnail] ✅ Fixed delegates.xml saved to:', fixedDelegatesPath);
    
    // Copy other essential config files from ImageMagick directory
    // This ensures ImageMagick can find all its configuration
    const configFiles = ['policy.xml', 'type.xml', 'colors.xml'];
    for (const configFile of configFiles) {
      const srcPath = path.join(magickDir, configFile);
      const dstPath = path.join(configDir, configFile);
      if (fs.existsSync(srcPath) && !fs.existsSync(dstPath)) {
        fs.copyFileSync(srcPath, dstPath);
        logToRenderer(`[Thumbnail] Copied ${configFile} to config directory`);
      }
    }
    
    return configDir;
    
  } catch (error) {
    errorToRenderer('[Thumbnail] ❌ Failed to fix delegates.xml:', error);
    return null;
  }
}

// Configure PDF.js to work in Node.js environment
const NodeCanvasFactory = {
  create(width: number, height: number) {
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
 * Generate a thumbnail from a label file (PDF or PNG)
 * Returns base64 encoded image data URL for direct use in <img> src
 * 
 * @param filePath - Full path to the label file (PDF or PNG)
 * @param width - Desired thumbnail width in pixels (default: 200)
 * @returns Base64 data URL string
 */
export async function generatePDFThumbnail(
  filePath: string,
  width: number = 200
): Promise<string> {
  try {
    console.log(`[Thumbnail] Generating thumbnail for: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`[Thumbnail] File not found: ${filePath}`);
      return generatePlaceholder(width, 'File Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();

    // Handle PNG/image files
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      return await generateImageThumbnail(filePath, width);
    }

    // Handle PDF files
    if (ext === '.pdf') {
      return await generatePDFThumbnailInternal(filePath, width);
    }

    console.warn(`[Thumbnail] Unsupported file type: ${ext}`);
    return generatePlaceholder(width, 'Unsupported Format');

  } catch (error) {
    console.error('[Thumbnail] Failed to generate thumbnail:', error);
    return generatePlaceholder(width, 'Error Loading File');
  }
}

/**
 * Generate thumbnail from an image file
 */
async function generateImageThumbnail(
  imagePath: string,
  width: number
): Promise<string> {
  console.log(`[Thumbnail] Generating image thumbnail: ${imagePath}`);

  // Get original dimensions
  const metadata = await sharp(imagePath).metadata();
  const originalWidth = metadata.width || width;
  const originalHeight = metadata.height || Math.floor(width * 1.5);

  // Calculate thumbnail height maintaining aspect ratio
  const scale = width / originalWidth;
  const height = Math.floor(originalHeight * scale);

  // Resize image to thumbnail size
  const thumbnail = await sharp(imagePath)
    .resize(width, height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  // Convert to base64 data URL
  const base64 = thumbnail.toString('base64');
  const dataUrl = `data:image/png;base64,${base64}`;

  console.log(`[Thumbnail] ✅ Image thumbnail generated: ${width}x${height}`);
  return dataUrl;
}

/**
 * Generate thumbnail from a PDF file using Ghostscript directly
 * Renders actual PDF content to image
 */
async function generatePDFThumbnailInternal(
  pdfPath: string,
  width: number
): Promise<string> {
  logToRenderer(`[Thumbnail] 🖼️ Generating PDF thumbnail: ${pdfPath}`);

  // Find Ghostscript
  const gsBinPath = findGhostscript();
  
  // Try Ghostscript if available and verified
  if (gsBinPath && verifyGhostscriptInstallation(gsBinPath)) {
    try {
      const gsExePath = path.resolve(gsBinPath, 'gswin64c.exe');
      logToRenderer('[Thumbnail] Using Ghostscript at:', gsExePath);

      // Set up Ghostscript environment
      const env = { ...process.env };
      env.PATH = `${gsBinPath}${path.delimiter}${env.PATH || ''}`;
      
      // Set GS_LIB to point to Ghostscript library directory
      const gsLibPath = path.join(path.dirname(gsBinPath), 'lib');
      if (fs.existsSync(gsLibPath)) {
        env.GS_LIB = gsLibPath;
        logToRenderer('[Thumbnail] Set GS_LIB:', gsLibPath);
      }

      // Get temp directory
      const userDataPath = app.getPath('userData');
      const tempDir = path.join(userDataPath, 'temp-thumbnails');
      
      // Create temp directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate unique output filename
      const outputFilename = `thumb_${Date.now()}.png`;
      const outputPath = path.join(tempDir, outputFilename);
      
      // Calculate height (2:3 aspect ratio)
      const height = Math.floor(width * 1.5);

      logToRenderer(`[Thumbnail] Converting first page of PDF to ${width}x${height} PNG...`);

      // Use Ghostscript to convert PDF to PNG
      const gsCommand = `"${gsExePath}" -dNOPAUSE -dBATCH -sDEVICE=png16m -r200 -dFirstPage=1 -dLastPage=1 -sOutputFile="${outputPath}" "${pdfPath}"`;
      
      logToRenderer(`[Thumbnail] Executing: ${gsCommand}`);
      
      // Execute Ghostscript command with working directory set
      const { stdout, stderr } = await execAsync(gsCommand, { 
        windowsHide: true, 
        env,
        cwd: gsBinPath  // Set working directory to Ghostscript bin
      });
      
      if (stdout) {
        logToRenderer(`[Thumbnail] Ghostscript stdout: ${stdout}`);
      }
      
      if (stderr) {
        // Ghostscript writes info to stderr even on success
        logToRenderer(`[Thumbnail] Ghostscript stderr: ${stderr}`);
      }

      // Verify the output file exists
      if (fs.existsSync(outputPath)) {
        // Resize to exact dimensions using Sharp
        const resizedBuffer = await sharp(outputPath)
          .resize(width, height, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          .png({ quality: 90, compressionLevel: 9 })
          .toBuffer();

        const base64Data = resizedBuffer.toString('base64');
        
        // Clean up temp file
        try {
          fs.unlinkSync(outputPath);
        } catch (cleanupError) {
          warnToRenderer('[Thumbnail] Failed to cleanup temp file:', cleanupError);
        }

        // Return as data URL
        const dataUrl = `data:image/png;base64,${base64Data}`;
        logToRenderer(`[Thumbnail] ✅ Ghostscript thumbnail generated successfully`);
        return dataUrl;
      } else {
        throw new Error('Ghostscript did not produce output file');
      }

    } catch (error: any) {
      errorToRenderer('[Thumbnail] ❌ Ghostscript failed');
      errorToRenderer('[Thumbnail] Error:', error.message);
      
      if (error.code) {
        errorToRenderer('[Thumbnail] Exit code:', error.code);
      }
      
      logToRenderer('[Thumbnail] Falling back to PDF.js...');
    }
  } else {
    logToRenderer('[Thumbnail] Ghostscript not available, using PDF.js');
  }
  
  // Fallback to PDF.js (always works)
  return await generatePDFThumbnailWithPdfJs(pdfPath, width);
}

/**
 * Generate thumbnail from a PDF file using PDF.js Canvas renderer
 * Pure JavaScript fallback that works without external dependencies
 */
async function generatePDFThumbnailWithPdfJs(
  pdfPath: string,
  width: number
): Promise<string> {
  console.log(`[Thumbnail] Generating PDF thumbnail with PDF.js: ${pdfPath}`);

  try {
    // Calculate height (2:3 aspect ratio)
    const height = Math.floor(width * 1.5);

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
    console.log(`[Thumbnail] PDF.js loaded document with ${pdfDocument.numPages} pages`);

    // Get first page
    const page = await pdfDocument.getPage(1);
    const viewport = page.getViewport({ scale: 1.0 });

    // Calculate scale to fit desired dimensions
    const scaleX = width / viewport.width;
    const scaleY = height / viewport.height;
    const scale = Math.min(scaleX, scaleY);

    // Create viewport with calculated scale
    const scaledViewport = page.getViewport({ scale });

    // Create canvas
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
    console.log(`[Thumbnail] PDF.js rendered page to canvas: ${Math.floor(scaledViewport.width)}x${Math.floor(scaledViewport.height)}`);

    // Convert canvas to PNG buffer using Sharp for optimization
    const canvasBuffer = canvasFactory.canvas.toBuffer('image/png');
    
    // Use Sharp to resize to exact dimensions and optimize
    const optimizedBuffer = await sharp(canvasBuffer)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toBuffer();

    // Clean up
    NodeCanvasFactory.destroy(canvasFactory);
    await pdfDocument.destroy();

    // Convert to base64 data URL
    const base64Data = optimizedBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Data}`;

    console.log(`[Thumbnail] ✅ PDF.js thumbnail generated successfully (data URL length: ${dataUrl.length})`);
    return dataUrl;

  } catch (error) {
    console.error('[Thumbnail] Failed to generate PDF thumbnail with PDF.js:', error);
    console.error('[Thumbnail] Falling back to placeholder');
    
    // Final fallback to placeholder
    return generatePDFPlaceholder(pdfPath, width);
  }
}

/**
 * Generate a high-quality placeholder thumbnail for PDFs (fallback)
 * Shows a professional label card with all important information
 */
function generatePDFPlaceholder(pdfPath: string, width: number): string {
  const thumbHeight = Math.floor(width * 1.5); // 2:3 aspect ratio
  
  try {
    // Try to get PDF info
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = PDFDocument.load(pdfBytes);
    
    // Get dimensions (sync)
    let dimensions = '100×150mm';
    try {
      const doc: any = pdfDoc;
      if (doc && typeof doc === 'object') {
        // Try to extract dimensions if possible
        dimensions = '100×150mm';
      }
    } catch (e) {
      // Ignore
    }

    const footerHeight = Math.floor(thumbHeight * 0.12);
    const contentHeight = thumbHeight - footerHeight;
    
    const svg = `
      <svg width="${width}" height="${thumbHeight}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background gradient -->
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#f8f9fa;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e9ecef;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <rect width="${width}" height="${thumbHeight}" fill="url(#bgGrad)"/>
        
        <!-- Border -->
        <rect x="3" y="3" width="${width - 6}" height="${thumbHeight - 6}" 
              fill="none" stroke="#dee2e6" stroke-width="3" rx="8"/>
        
        <!-- Inner content box -->
        <rect x="15" y="15" width="${width - 30}" height="${contentHeight - 30}" 
              fill="white" stroke="#adb5bd" stroke-width="2" rx="6"/>
        
        <!-- Shipping icon -->
        <text x="${width / 2}" y="${contentHeight * 0.28}" 
              text-anchor="middle" font-size="${Math.floor(width / 4.5)}" 
              fill="#495057">
          📦
        </text>
        
        <!-- Label text -->
        <text x="${width / 2}" y="${contentHeight * 0.48}" 
              text-anchor="middle" font-size="${Math.floor(width / 16)}" font-weight="bold"
              fill="#212529" font-family="Arial, sans-serif">
          Shipping Label
        </text>
        
        <!-- Dimensions -->
        <text x="${width / 2}" y="${contentHeight * 0.60}" 
              text-anchor="middle" font-size="${Math.floor(width / 22)}"
              fill="#6c757d" font-family="Arial, sans-serif">
          ${dimensions}
        </text>
        
        <!-- Status badge -->
        <rect x="${width / 2 - 40}" y="${contentHeight * 0.70}" width="80" height="20" 
              fill="#28a745" rx="10"/>
        <text x="${width / 2}" y="${contentHeight * 0.70 + 14}" 
              text-anchor="middle" font-size="${Math.floor(width / 28)}" font-weight="600"
              fill="white" font-family="Arial, sans-serif">
          Ready
        </text>
        
        <!-- Footer -->
        <rect y="${contentHeight}" width="${width}" height="${footerHeight}" fill="#343a40"/>
        <text x="${width / 2}" y="${contentHeight + footerHeight / 2 + 5}" 
              text-anchor="middle" font-size="${Math.floor(footerHeight / 2.5)}" font-weight="600"
              fill="white" font-family="Arial, sans-serif">
          WITH FOOTER
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch (error) {
    // Simple fallback
    const svg = `
      <svg width="${width}" height="${thumbHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${thumbHeight}" fill="#f8f8f8" stroke="#ddd" stroke-width="2"/>
        <text x="50%" y="45%" text-anchor="middle" font-size="20" fill="#666" font-family="Arial">📄 PDF Label</text>
        <text x="50%" y="60%" text-anchor="middle" font-size="12" fill="#999" font-family="Arial">Ready to Print</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
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

