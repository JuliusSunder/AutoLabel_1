/**
 * Printer Manager
 * Handles OS printer enumeration and print operations
 */

import { BrowserWindow } from 'electron';
import fs from 'node:fs';
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
 * Print a PDF file to a printer
 */
export async function printPdf(
  pdfPath: string,
  printerName?: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Verify file exists
      if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF file not found: ${pdfPath}`);
      }

      // Get main window
      const windows = BrowserWindow.getAllWindows();
      if (windows.length === 0) {
        throw new Error('No windows available for printing');
      }

      const mainWindow = windows[0];

      // If no printer specified, use default
      let targetPrinter = printerName;
      if (!targetPrinter) {
        targetPrinter = await getDefaultPrinter();
        if (!targetPrinter) {
          throw new Error('No default printer found');
        }
      }

      console.log(`[Printer] Printing ${pdfPath} to ${targetPrinter}`);

      // For Electron, we need to load the PDF in a hidden window and print it
      // Create a hidden window for printing
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Load PDF
      await printWindow.loadFile(pdfPath);

      // Print options
      const printOptions: Electron.PrintToPDFOptions = {
        silent: true, // Don't show print dialog
        printBackground: true,
        deviceName: targetPrinter,
      };

      // Print
      printWindow.webContents.print(printOptions, (success, errorType) => {
        // Close the print window
        printWindow.close();

        if (success) {
          console.log(`[Printer] Successfully printed: ${pdfPath}`);
          resolve();
        } else {
          console.error(`[Printer] Print failed: ${errorType}`);
          reject(new Error(`Print failed: ${errorType}`));
        }
      });
    } catch (error) {
      console.error('[Printer] Print error:', error);
      reject(error);
    }
  });
}
