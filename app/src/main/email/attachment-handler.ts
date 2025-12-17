/**
 * Attachment Handler
 * Saves email attachments to disk
 */

import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { EmailMessage } from './imap-client';

/**
 * Get attachments directory path
 */
function getAttachmentsDir(): string {
  const userDataPath = app.getPath('userData');
  const attachmentsPath = path.join(userDataPath, 'attachments');

  // Create directory if it doesn't exist
  if (!fs.existsSync(attachmentsPath)) {
    fs.mkdirSync(attachmentsPath, { recursive: true });
  }

  return attachmentsPath;
}

/**
 * Get sale-specific directory
 */
function getSaleDir(saleId: string): string {
  const attachmentsDir = getAttachmentsDir();
  const saleDir = path.join(attachmentsDir, saleId);

  // Create directory if it doesn't exist
  if (!fs.existsSync(saleDir)) {
    fs.mkdirSync(saleDir, { recursive: true });
  }

  return saleDir;
}

/**
 * Determine attachment type from filename/content type
 */
function getAttachmentType(
  filename: string,
  contentType: string
): 'pdf' | 'image' | null {
  const lowerFilename = filename.toLowerCase();
  const lowerContentType = contentType.toLowerCase();

  if (lowerFilename.endsWith('.pdf') || lowerContentType.includes('pdf')) {
    return 'pdf';
  }

  if (
    lowerFilename.endsWith('.png') ||
    lowerFilename.endsWith('.jpg') ||
    lowerFilename.endsWith('.jpeg') ||
    lowerContentType.includes('image')
  ) {
    return 'image';
  }

  return null;
}

/**
 * Save email attachments to disk
 * Returns array of saved attachment info
 */
export function saveAttachments(
  email: EmailMessage,
  saleId: string
): Array<{
  type: 'pdf' | 'image';
  localPath: string;
  originalFilename: string;
}> {
  const saleDir = getSaleDir(saleId);
  const savedAttachments: Array<{
    type: 'pdf' | 'image';
    localPath: string;
    originalFilename: string;
  }> = [];

  let labelIndex = 0;

  for (const attachment of email.attachments) {
    const attachmentType = getAttachmentType(
      attachment.filename,
      attachment.contentType
    );

    // Only save label attachments (PDF or image)
    if (!attachmentType) {
      console.log(
        `[Attachments] Skipping non-label attachment: ${attachment.filename}`
      );
      continue;
    }

    try {
      // Generate filename: label_0.pdf, label_1.png, etc.
      const ext = attachmentType === 'pdf' ? 'pdf' : path.extname(attachment.filename) || '.png';
      const filename = `label_${labelIndex}${ext}`;
      const filePath = path.join(saleDir, filename);

      // Write attachment to disk
      fs.writeFileSync(filePath, attachment.content);

      savedAttachments.push({
        type: attachmentType,
        localPath: filePath,
        originalFilename: attachment.filename,
      });

      labelIndex++;

      console.log(`[Attachments] Saved ${attachmentType}: ${filePath}`);
    } catch (error) {
      console.error(
        `[Attachments] Failed to save attachment ${attachment.filename}:`,
        error
      );
    }
  }

  return savedAttachments;
}

/**
 * Clean up old attachments (for maintenance)
 */
export function cleanupOldAttachments(daysOld: number = 90): void {
  const attachmentsDir = getAttachmentsDir();
  const now = Date.now();
  const cutoffTime = now - daysOld * 24 * 60 * 60 * 1000;

  try {
    const saleDirs = fs.readdirSync(attachmentsDir);

    for (const saleDir of saleDirs) {
      const saleDirPath = path.join(attachmentsDir, saleDir);
      const stats = fs.statSync(saleDirPath);

      if (stats.mtimeMs < cutoffTime) {
        fs.rmSync(saleDirPath, { recursive: true, force: true });
        console.log(`[Attachments] Cleaned up old sale dir: ${saleDir}`);
      }
    }
  } catch (error) {
    console.error('[Attachments] Error cleaning up attachments:', error);
  }
}
