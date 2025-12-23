/**
 * Printer Manager
 * Handles OS printer enumeration and print operations
 */

import { BrowserWindow, app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import type { PrinterInfo } from '../../shared/types';

/**
 * Get list of available printers
 */
export async function listPrinters(): Promise<PrinterInfo[]> {
  try {
    // Get printers from Electron's webContents
    // We need a BrowserWindow to access webContents
    const windows = BrowserWindow.getAllWindows();
    if (windows.length === 0) {
      console.warn('[Printer] No windows available to enumerate printers');
      return [];
    }

    const mainWindow = windows[0];
    const printers = await mainWindow.webContents.getPrintersAsync();

    return printers.map((printer) => ({
      name: printer.name,
      isDefault: printer.isDefault || false,
      status: printer.status?.toString() || 'unknown',
    }));
  } catch (error) {
    console.error('[Printer] Failed to list printers:', error);
    return [];
  }
}

/**
 * Get default printer
 */
export async function getDefaultPrinter(): Promise<string | null> {
  const printers = await listPrinters();
  const defaultPrinter = printers.find((p) => p.isDefault);
  return defaultPrinter?.name || null;
}

/**
 * Find SumatraPDF executable
 * Searches in common installation paths
 */
function findSumatraPDF(): string | null {
  const possiblePaths = [
    'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe',
    'C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe',
    path.join(process.cwd(), 'app', 'bin', 'SumatraPDF', 'SumatraPDF.exe'),
    path.join(app.getAppPath(), 'bin', 'SumatraPDF', 'SumatraPDF.exe'),
    path.join(process.cwd(), 'app', 'bin', 'SumatraPDF.exe'), // Legacy path
    path.join(app.getAppPath(), 'bin', 'SumatraPDF.exe'), // Legacy path
  ];

  for (const sumatraPath of possiblePaths) {
    if (fs.existsSync(sumatraPath)) {
      console.log(`[Printer] Found SumatraPDF at: ${sumatraPath}`);
      return sumatraPath;
    }
  }

  // Try to find in PATH
  try {
    execSync('where SumatraPDF.exe', { encoding: 'utf-8' });
    console.log('[Printer] Found SumatraPDF in system PATH');
    return 'SumatraPDF.exe';
  } catch {
    // Not in PATH
  }

  console.warn('[Printer] SumatraPDF not found in any standard location');
  return null;
}

/**
 * Print PDF using SumatraPDF (preferred method for label printers)
 */
async function printPdfWithSumatra(
  pdfPath: string,
  printerName: string
): Promise<void> {
  const sumatraPath = findSumatraPDF();
  if (!sumatraPath) {
    throw new Error('SumatraPDF not found');
  }

  // Escape paths for command line
  const escapedPdfPath = `"${pdfPath}"`;
  const escapedPrinterName = `"${printerName}"`;
  const escapedSumatraPath = `"${sumatraPath}"`;

  // Build command: SumatraPDF.exe -print-to "Printer Name" "file.pdf"
  const command = `${escapedSumatraPath} -print-to ${escapedPrinterName} ${escapedPdfPath}`;

  console.log(`[Printer] Executing SumatraPDF command: ${command}`);

  try {
    // Execute synchronously and wait for completion
    execSync(command, {
      encoding: 'utf-8',
      timeout: 30000, // 30 second timeout
      windowsHide: true, // Don't show console window
    });

    console.log(`[Printer] SumatraPDF print completed successfully`);
  } catch (error) {
    console.error('[Printer] SumatraPDF print failed:', error);
    throw new Error(
      `SumatraPDF print failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Print PDF using Electron (fallback method)
 * This method has issues with label printers (black backgrounds, etc.)
 */
async function printPdfWithElectron(
  pdfPath: string,
  printerName: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length === 0) {
        throw new Error('No windows available for printing');
      }

      console.log('[Printer] Using Electron fallback method (may have rendering issues)');

      // Create a hidden window for printing with WHITE background
      const printWindow = new BrowserWindow({
        show: false,
        backgroundColor: '#FFFFFF',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          backgroundThrottling: false,
        },
      });

      // Load PDF
      await printWindow.loadFile(pdfPath);

      // Print options
      const printOptions: Electron.WebContentsPrintOptions = {
        silent: true,
        printBackground: false,
        color: false,
        deviceName: printerName,
        margins: {
          marginType: 'none',
        },
      };

      // Print
      printWindow.webContents.print(printOptions, (success, errorType) => {
        printWindow.close();

        if (success) {
          console.log(`[Printer] Electron print completed`);
          resolve();
        } else {
          console.error(`[Printer] Electron print failed: ${errorType}`);
          reject(new Error(`Print failed: ${errorType}`));
        }
      });
    } catch (error) {
      console.error('[Printer] Electron print error:', error);
      reject(error);
    }
  });
}

/**
 * Print a PDF file to a printer
 * Tries SumatraPDF first (preferred), falls back to Electron if not available
 */
export async function printPdf(
  pdfPath: string,
  printerName?: string
): Promise<void> {
  try {
    // Verify file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    // If no printer specified, use default
    let targetPrinter = printerName;
    if (!targetPrinter) {
      targetPrinter = await getDefaultPrinter();
      if (!targetPrinter) {
        throw new Error('No default printer found');
      }
    }

    console.log(`[Printer] Printing ${pdfPath} to ${targetPrinter}`);

    // Try SumatraPDF first (preferred method for label printers)
    try {
      await printPdfWithSumatra(pdfPath, targetPrinter);
      console.log('[Printer] ✓ Successfully printed with SumatraPDF');
      return;
    } catch (sumatraError) {
      console.warn('[Printer] SumatraPDF failed, trying Electron fallback:', sumatraError);
      
      // Fall back to Electron method
      await printPdfWithElectron(pdfPath, targetPrinter);
      console.log('[Printer] ✓ Successfully printed with Electron fallback');
    }
  } catch (error) {
    console.error('[Printer] All print methods failed:', error);
    throw error;
  }
}
