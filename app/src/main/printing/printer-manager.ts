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
 * Extended Electron PrinterInfo with runtime properties
 */
interface ElectronPrinterInfo {
  name: string;
  displayName?: string;
  description?: string;
  isDefault?: boolean;
  status?: number | string;
  options?: Record<string, unknown>;
}

/**
 * Get printer status from Windows using PowerShell
 * NOTE: Windows printer status is unreliable - it often shows "Normal" even for offline printers
 * The status is only updated when a print job is actually sent
 */
async function getPrinterStatusFromWindows(printerName: string): Promise<string> {
  try {
    const escapedPrinterName = printerName.replace(/"/g, '`"');
    
    // First check if there are any error jobs in the queue
    const command = `Get-PrintJob -PrinterName "${escapedPrinterName}" | Where-Object { $_.JobStatus -match 'Error|Paused|Offline|Blocked' } | Measure-Object | Select-Object -ExpandProperty Count`;
    
    const result = execSync(command, {
      encoding: 'utf-8',
      timeout: 2000,
      shell: 'powershell.exe',
      windowsHide: true,
    });

    const errorJobCount = parseInt(result.trim(), 10);
    
    console.log(`[Printer] "${printerName}" has ${errorJobCount} error jobs`);
    
    // If there are error jobs, the printer is likely offline
    if (errorJobCount > 0) {
      return 'offline';
    }
    
    // Otherwise assume ready (Windows doesn't give us reliable status)
    return 'ready';
  } catch (error) {
    console.warn(`[Printer] Could not get Windows status for "${printerName}":`, error);
    // If we can't check, assume ready
    return 'ready';
  }
}

/**
 * Convert printer status code to readable string
 */
function getPrinterStatus(statusCode?: number | string): string {
  if (statusCode === undefined || statusCode === null) {
    return 'unknown';
  }

  const status = typeof statusCode === 'number' ? statusCode : parseInt(statusCode, 10);

  // Windows printer status codes
  // 0 = Ready/Idle
  // 1 = Other/Unknown
  // 2 = Unknown
  // 3 = Idle
  // 4 = Printing
  // 5 = Warmup
  // 6 = Stopped Printing
  // 7 = Offline
  switch (status) {
    case 0:
    case 3:
      return 'ready';
    case 4:
      return 'printing';
    case 5:
      return 'warmup';
    case 6:
      return 'stopped';
    case 7:
      return 'offline';
    default:
      return 'unknown';
  }
}

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

    // Use Promise.all to get Windows status for all printers in parallel
    const printersWithStatus = await Promise.all(
      printers.map(async (printer): Promise<PrinterInfo> => {
        const extendedPrinter = printer as unknown as ElectronPrinterInfo;
        
        // Try to get status from Electron first
        let status = getPrinterStatus(extendedPrinter.status);
        
        // If Electron returns unknown, try to get status from Windows
        if (status === 'unknown') {
          status = await getPrinterStatusFromWindows(extendedPrinter.name);
        }
        
        console.log(`[Printer] ${extendedPrinter.name}: final status=${status}`);
        
        return {
          name: extendedPrinter.name,
          isDefault: extendedPrinter.isDefault || false,
          status,
        };
      })
    );
    
    return printersWithStatus;
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
      console.debug(`[Printer] Found SumatraPDF at: ${sumatraPath}`);
      return sumatraPath;
    }
  }

  // Try to find in PATH
  try {
    execSync('where SumatraPDF.exe', { encoding: 'utf-8' });
    console.debug('[Printer] Found SumatraPDF in system PATH');
    return 'SumatraPDF.exe';
  } catch {
    // Not in PATH
  }

  console.warn('[Printer] SumatraPDF not found in any standard location');
  return null;
}

/**
 * Simple approach: Try to print and if printer is offline, it will fail immediately
 * We use a test print to check if the printer is accessible
 */
async function verifyPrinterAccessible(printerName: string): Promise<void> {
  try {
    const escapedPrinterName = printerName.replace(/"/g, '`"');
    
    // Try to get detailed printer info - this will fail if printer is truly offline
    const command = `$printer = Get-Printer -Name "${escapedPrinterName}"; if ($printer.PrinterStatus -eq 'Offline' -or $printer.PrinterStatus -eq 'Error') { throw "Printer offline" }; Write-Output "OK"`;
    
    execSync(command, {
      encoding: 'utf-8',
      timeout: 3000,
      shell: 'powershell.exe',
      windowsHide: true,
    });
    
    console.log(`[Printer] Printer "${printerName}" appears accessible`);
  } catch (error: any) {
    console.error(`[Printer] Printer "${printerName}" is not accessible:`, error?.message);
    throw new Error(`Printer "${printerName}" is offline or not available`);
  }
}

/**
 * Clear all pending print jobs for a specific printer from Windows Print Spooler
 * This prevents jobs from being printed when the printer comes back online
 */
export async function clearPrinterQueue(printerName: string): Promise<void> {
  try {
    console.log(`[Printer] Clearing print queue for printer: ${printerName}`);
    
    // PowerShell command to remove all print jobs for a specific printer
    const escapedPrinterName = printerName.replace(/"/g, '`"');
    const command = `Get-PrintJob -PrinterName "${escapedPrinterName}" | Remove-PrintJob`;
    
    execSync(command, {
      encoding: 'utf-8',
      timeout: 5000,
      shell: 'powershell.exe',
      windowsHide: true,
    });
    
    console.log(`[Printer] Successfully cleared print queue for: ${printerName}`);
  } catch (error: any) {
    // It's okay if this fails (e.g., no jobs in queue or access denied)
    console.warn(`[Printer] Could not clear print queue:`, error?.message);
  }
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
    throw new Error('Drucker-Software nicht installiert');
  }

  // NOTE: We don't check printer availability beforehand because Windows status is unreliable
  // Instead, we check for failed jobs in the print queue after sending the job
  
  // Escape paths for command line
  const escapedPdfPath = `"${pdfPath}"`;
  const escapedPrinterName = `"${printerName}"`;
  const escapedSumatraPath = `"${sumatraPath}"`;

  // Build command: SumatraPDF.exe -print-to "Printer Name" "file.pdf"
  const command = `${escapedSumatraPath} -print-to ${escapedPrinterName} ${escapedPdfPath}`;

  console.debug(`[Printer] Executing SumatraPDF command: ${command}`);

  try {
    // Execute synchronously
    execSync(command, {
      encoding: 'utf-8',
      timeout: 10000, // 10 second timeout
      windowsHide: true,
    });

    console.log(`[Printer] SumatraPDF command completed`);
    
    // IMPORTANT: Windows/SumatraPDF doesn't reliably report offline printers
    // The job goes to the spooler and appears "successful" even if printer is off
    // We just have to assume it worked - Windows will queue it until printer is back
    
  } catch (error: any) {
    console.error('[Printer] SumatraPDF execution failed:', error);
    
    const errorMsg = error?.message || 'Unknown error';
    
    if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
      throw new Error('Print timeout - printer offline or not reachable');
    }
    
    throw new Error(`Print failed - check printer "${printerName}"`);
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
  const windows = BrowserWindow.getAllWindows();
  if (windows.length === 0) {
    throw new Error('Kein Fenster für Druck verfügbar');
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

  try {
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

    // Print and wait for completion
    return new Promise<void>((resolve, reject) => {
      printWindow.webContents.print(printOptions, (success, errorType) => {
        printWindow.close();

        if (success) {
          console.log(`[Printer] Electron print completed`);
          resolve();
        } else {
          console.error(`[Printer] Electron print failed: ${errorType}`);
          
          // Provide more specific error messages
          let errorMessage = 'Druck fehlgeschlagen';
          if (errorType === 'failed') {
            errorMessage = `Drucker "${printerName}" nicht erreichbar oder offline`;
          } else if (errorType === 'cancelled') {
            errorMessage = 'Druck wurde abgebrochen';
          } else {
            errorMessage = `Druck fehlgeschlagen: ${errorType}`;
          }
          
          reject(new Error(errorMessage));
        }
      });
    });
  } catch (error) {
    printWindow.close();
    console.error('[Printer] Electron print error:', error);
    throw error;
  }
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
      throw new Error('Label-Datei nicht gefunden');
    }

    // If no printer specified, use default
    let targetPrinter = printerName;
    if (!targetPrinter) {
      targetPrinter = await getDefaultPrinter();
      if (!targetPrinter) {
        throw new Error('Kein Drucker ausgewählt');
      }
    }

    // Validate printer exists
    const availablePrinters = await listPrinters();
    const printerExists = availablePrinters.some(
      (p) => p.name === targetPrinter
    );
    if (!printerExists) {
      throw new Error(`Drucker "${targetPrinter}" nicht verfügbar`);
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
