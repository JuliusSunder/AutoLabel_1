/**
 * Folder Scanner
 * Scans watched folders for shipping label files
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { app } from 'electron';
import type { WatchedFolder, ScanResult } from '../../shared/types';
import { detectShippingCompanyFromPDF, extractTextFromPDF } from '../email/pdf-analyzer';
import * as salesRepo from '../database/repositories/sales';
import * as attachmentsRepo from '../database/repositories/attachments';
import { generateId } from '../database/db';

/**
 * File patterns for shipping labels
 */
const POSITIVE_PATTERNS = [
  /versandschein/i,
  /versandetikett/i,
  /label/i,
  /vinted-online-versandschein/i,
  /vinted-label/i,
  /shipping[-_]?label/i,
  /paketschein/i,
];

const NEGATIVE_PATTERNS = [
  /rechnung/i,
  /invoice/i,
  /quittung/i,
  /receipt/i,
  /bestätigung/i,
  /confirmation/i,
];

/**
 * Supported file extensions
 */
const SUPPORTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

/**
 * Check if filename matches positive patterns and doesn't match negative patterns
 */
function isValidLabelFilename(filename: string): boolean {
  const hasPositiveMatch = POSITIVE_PATTERNS.some(pattern => pattern.test(filename));
  const hasNegativeMatch = NEGATIVE_PATTERNS.some(pattern => pattern.test(filename));
  
  return hasPositiveMatch && !hasNegativeMatch;
}

/**
 * Calculate file hash for deduplication
 */
function calculateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Recursively scan directory for files
 */
function scanDirectoryRecursive(dirPath: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      try {
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = scanDirectoryRecursive(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (SUPPORTED_EXTENSIONS.includes(ext)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`[Folder Scanner] Error accessing ${fullPath}:`, error);
        // Continue with other files
      }
    }
  } catch (error) {
    console.error(`[Folder Scanner] Error reading directory ${dirPath}:`, error);
  }
  
  return files;
}

/**
 * Extract metadata from filename
 */
function extractMetadataFromFilename(filename: string): {
  platform?: string;
  productNumber?: string;
} {
  const metadata: { platform?: string; productNumber?: string } = {};
  
  // Detect Vinted
  if (/vinted/i.test(filename)) {
    metadata.platform = 'Vinted/Kleiderkreisel';
    
    // Try to extract product number from Vinted filename
    // Pattern: Vinted-Online-Versandschein-16905310214.pdf
    const vintedMatch = filename.match(/vinted.*?(\d{10,})/i);
    if (vintedMatch) {
      metadata.productNumber = vintedMatch[1];
    }
  }
  
  // Detect other platforms
  if (/ebay/i.test(filename)) {
    metadata.platform = 'eBay';
  } else if (/amazon/i.test(filename)) {
    metadata.platform = 'Amazon';
  } else if (/etsy/i.test(filename)) {
    metadata.platform = 'Etsy';
  }
  
  return metadata;
}

/**
 * Copy file to attachments directory
 */
function copyFileToAttachments(sourcePath: string, saleId: string): {
  localPath: string;
  originalFilename: string;
  type: 'pdf' | 'image';
} {
  const ext = path.extname(sourcePath).toLowerCase();
  const originalFilename = path.basename(sourcePath);
  const type: 'pdf' | 'image' = ext === '.pdf' ? 'pdf' : 'image';
  
  // Create attachments directory if it doesn't exist
  const attachmentsDir = path.join(app.getPath('userData'), 'attachments');
  if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
  }
  
  // Generate unique filename
  const uniqueFilename = `${saleId}_${Date.now()}${ext}`;
  const localPath = path.join(attachmentsDir, uniqueFilename);
  
  // Copy file
  fs.copyFileSync(sourcePath, localPath);
  
  return {
    localPath,
    originalFilename,
    type,
  };
}

/**
 * Scan a single watched folder
 */
export async function scanFolder(folder: WatchedFolder): Promise<{
  scannedCount: number;
  newSales: number;
  errors: string[];
}> {
  console.log(`\n[Folder Scanner] ========================================`);
  console.log(`[Folder Scanner] Scanning folder: ${folder.name}`);
  console.log(`[Folder Scanner] Path: ${folder.folderPath}`);
  console.log(`[Folder Scanner] ========================================`);

  const errors: string[] = [];
  let scannedCount = 0;
  let newSales = 0;

  try {
    // Check if folder exists
    if (!fs.existsSync(folder.folderPath)) {
      const error = `Folder does not exist: ${folder.folderPath}`;
      console.error(`[Folder Scanner] ${error}`);
      errors.push(error);
      return { scannedCount: 0, newSales: 0, errors };
    }

    // Check if it's a directory
    const stats = fs.statSync(folder.folderPath);
    if (!stats.isDirectory()) {
      const error = `Path is not a directory: ${folder.folderPath}`;
      console.error(`[Folder Scanner] ${error}`);
      errors.push(error);
      return { scannedCount: 0, newSales: 0, errors };
    }

    // Scan directory recursively
    console.log('[Folder Scanner] Scanning directory recursively...');
    const allFiles = scanDirectoryRecursive(folder.folderPath);
    console.log(`[Folder Scanner] Found ${allFiles.length} files with supported extensions`);

    // Filter files by filename patterns
    const validFiles = allFiles.filter(filePath => {
      const filename = path.basename(filePath);
      return isValidLabelFilename(filename);
    });

    scannedCount = validFiles.length;
    console.log(`[Folder Scanner] Found ${scannedCount} files matching label patterns\n`);

    if (validFiles.length === 0) {
      console.log('[Folder Scanner] No valid label files found');
      return { scannedCount: 0, newSales: 0, errors: [] };
    }

    // Process each file
    for (const filePath of validFiles) {
      try {
        const filename = path.basename(filePath);
        console.log(`\n[Folder Scanner] 🔍 Processing: ${filename}`);

        // Calculate file hash for deduplication
        const fileHash = calculateFileHash(filePath);
        const emailId = `folder_${fileHash}`; // Use hash as unique ID

        // Check if already processed
        const existing = salesRepo.getSaleByEmailId(emailId);
        if (existing) {
          console.log(`[Folder Scanner] ⏭️  Skipping already processed file: ${filename}`);
          continue;
        }

        // Extract metadata from filename
        const filenameMetadata = extractMetadataFromFilename(filename);
        console.log(`[Folder Scanner] 📝 Filename metadata:`, filenameMetadata);

        // Detect shipping company from PDF (if PDF)
        let shippingCompany: string | undefined;
        const ext = path.extname(filePath).toLowerCase();
        
        if (ext === '.pdf') {
          console.log(`[Folder Scanner] 🔍 Attempting to detect shipping company from PDF...`);
          shippingCompany = await detectShippingCompanyFromPDF(filePath);
          if (shippingCompany) {
            console.log(`[Folder Scanner] ✅ Detected shipping company: ${shippingCompany}`);
          } else {
            console.log(`[Folder Scanner] ⚠️  Could not detect shipping company from PDF`);
          }
        } else {
          console.log(`[Folder Scanner] ℹ️  File is not a PDF, skipping shipping company detection`);
        }

        // Get file modification time as date
        const fileStats = fs.statSync(filePath);
        const fileDate = fileStats.mtime.toISOString().split('T')[0];

        // Create sale record
        const saleId = generateId();
        
        console.log(`[Folder Scanner] 💾 Creating sale with:`);
        console.log(`   - Email ID: ${emailId}`);
        console.log(`   - Date: ${fileDate}`);
        console.log(`   - Platform: ${filenameMetadata.platform || 'None'}`);
        console.log(`   - Shipping Company: ${shippingCompany || 'None'}`);
        console.log(`   - Product Number: ${filenameMetadata.productNumber || 'None'}`);
        
        const sale = salesRepo.createSale({
          emailId: emailId,
          date: fileDate,
          platform: filenameMetadata.platform,
          shippingCompany: shippingCompany,
          productNumber: filenameMetadata.productNumber,
          itemTitle: filename, // Use filename as item title
          folderId: folder.id, // Link to folder
          metadata: {
            source: 'folder',
            folderName: folder.name,
            folderPath: folder.folderPath,
            originalPath: filePath,
            fileHash: fileHash,
            fileModifiedAt: fileStats.mtime.toISOString(),
          },
        });

        console.log(`[Folder Scanner] ✅ Sale created successfully: ${sale.id}`);
        console.log(`   - Stored Platform: ${sale.platform || 'None'}`);
        console.log(`   - Stored Shipping Company: ${sale.shippingCompany || 'None'}`);
        console.log(`   - Stored Product Number: ${sale.productNumber || 'None'}`);

        // Copy file to attachments directory
        const attachment = copyFileToAttachments(filePath, saleId);
        
        // Create attachment record
        attachmentsRepo.createAttachment({
          saleId: sale.id,
          type: attachment.type,
          localPath: attachment.localPath,
          sourceEmailId: emailId,
          originalFilename: attachment.originalFilename,
        });

        console.log(`[Folder Scanner] 📎 Saved attachment: ${attachment.originalFilename}`);

        newSales++;
      } catch (error) {
        console.error(`[Folder Scanner] ❌ Error processing file ${filePath}:`, error);
        errors.push(`Failed to process ${path.basename(filePath)}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`\n[Folder Scanner] Folder ${folder.name} complete: ${newSales} sales from ${scannedCount} files`);

    return { scannedCount, newSales, errors };
  } catch (error) {
    console.error(`[Folder Scanner] Folder ${folder.name} scan failed:`, error);
    return {
      scannedCount: 0,
      newSales: 0,
      errors: [`${folder.name}: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Scan all active folders
 */
export async function scanAllFolders(folders: WatchedFolder[]): Promise<{
  scannedCount: number;
  newSales: number;
  errors: string[];
}> {
  console.log(`\n[Folder Scanner] Starting scan of ${folders.length} folder(s)...`);

  let totalScanned = 0;
  let totalNewSales = 0;
  const allErrors: string[] = [];

  for (const folder of folders) {
    const result = await scanFolder(folder);
    totalScanned += result.scannedCount;
    totalNewSales += result.newSales;
    allErrors.push(...result.errors);
  }

  console.log(`\n[Folder Scanner] ========================================`);
  console.log(`[Folder Scanner] SCAN COMPLETE`);
  console.log(`  Files checked: ${totalScanned}`);
  console.log(`  Sales imported: ${totalNewSales}`);
  console.log(`  Errors: ${allErrors.length}`);
  console.log(`========================================\n`);

  return {
    scannedCount: totalScanned,
    newSales: totalNewSales,
    errors: allErrors,
  };
}

