/**
 * Printer Manager
 * Handles OS printer enumeration and print operations
 */

import { BrowserWindow, app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import type { PrinterInfo } from '../../shared/types';
import { warnToRenderer } from '../utils/renderer-logger';

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
 * Searches in bundled app directory and common installation paths
 */
function findSumatraPDF(): string | null {
  const possiblePaths = [
    // Primary location: resources/SumatraPDF/ (direct extraResource location)
    path.join(process.resourcesPath || '', 'SumatraPDF', 'SumatraPDF.exe'),
    // Alternative location: resources/bin/SumatraPDF/ (with bin/ folder)
    path.join(process.resourcesPath || '', 'bin', 'SumatraPDF', 'SumatraPDF.exe'),
    // Unpacked location: resources/app.asar.unpacked/bin/SumatraPDF/ (AutoUnpackNativesPlugin)
    path.join(process.resourcesPath || '', 'app.asar.unpacked', 'bin', 'SumatraPDF', 'SumatraPDF.exe'),
    // Development paths (when running from source)
    path.join(app.getAppPath(), 'bin', 'SumatraPDF', 'SumatraPDF.exe'),
    path.join(process.cwd(), 'app', 'bin', 'SumatraPDF', 'SumatraPDF.exe'),
    // Legacy bundled paths (for backwards compatibility)
    path.join(process.resourcesPath || '', 'bin', 'SumatraPDF.exe'),
    path.join(app.getAppPath(), 'bin', 'SumatraPDF.exe'),
    path.join(process.cwd(), 'app', 'bin', 'SumatraPDF.exe'),
    // System installations (fallback)
    'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe',
    'C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe',
  ];

  console.log('[Printer] ========================================');
  console.log('[Printer] 🔍 Searching for SumatraPDF...');
  console.log('[Printer] process.resourcesPath:', process.resourcesPath);
  console.log('[Printer] app.getAppPath():', app.getAppPath());
  console.log('[Printer] process.cwd():', process.cwd());
  console.log('[Printer] ========================================');
  
  for (const sumatraPath of possiblePaths) {
    console.log(`[Printer] Checking: ${sumatraPath}`);
    
    // Skip ASAR paths (without .unpacked) - Windows cannot execute .exe files from ASAR archives
    if (sumatraPath.includes('app.asar') && !sumatraPath.includes('app.asar.unpacked')) {
      console.log(`[Printer] ⚠️ Skipping ASAR path (cannot execute .exe from ASAR): ${sumatraPath}`);
      continue;
    }
    
    if (fs.existsSync(sumatraPath)) {
      console.log(`[Printer] ✅ FOUND SumatraPDF at: ${sumatraPath}`);
      return sumatraPath;
    } else {
      console.log(`[Printer] ❌ Not found at: ${sumatraPath}`);
    }
  }

  // Try to find in PATH
  try {
    const result = execSync('where SumatraPDF.exe', { encoding: 'utf-8', windowsHide: true });
    console.log('[Printer] ✅ Found SumatraPDF in system PATH:', result.trim());
    return 'SumatraPDF.exe';
  } catch {
    console.log('[Printer] ❌ Not found in system PATH');
  }

  console.error('[Printer] ⚠️⚠️⚠️ SumatraPDF NOT FOUND IN ANY LOCATION ⚠️⚠️⚠️');
  console.error('[Printer] This will cause printing issues with label printers!');
  console.error('[Printer] Searched paths:', possiblePaths);
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
    throw new Error(
      'SumatraPDF nicht gefunden. Drucken könnte Probleme haben. ' +
      'Bitte kontaktieren Sie den Support falls Druckprobleme auftreten.'
    );
  }

  console.log(`[Printer] Using SumatraPDF at: ${sumatraPath}`);
  warnToRenderer(`[Printer] Using SumatraPDF at: ${sumatraPath}`);

  // NOTE: We don't check printer availability beforehand because Windows status is unreliable
  // Instead, we check for failed jobs in the print queue after sending the job
  
  // Escape paths for command line
  const escapedPdfPath = `"${pdfPath}"`;
  const escapedPrinterName = `"${printerName}"`;
  const escapedSumatraPath = `"${sumatraPath}"`;

  // Build command: SumatraPDF.exe -print-to "Printer Name" "file.pdf"
  const command = `${escapedSumatraPath} -print-to ${escapedPrinterName} ${escapedPdfPath}`;

  console.log(`[Printer] Executing SumatraPDF command: ${command}`);
  warnToRenderer(`[Printer] Executing SumatraPDF: ${printerName}`);

  try {
    // Execute synchronously
    const output = execSync(command, {
      encoding: 'utf-8',
      timeout: 10000, // 10 second timeout
      windowsHide: true,
    });

    console.log(`[Printer] SumatraPDF command completed`);
    console.log(`[Printer] SumatraPDF output:`, output);
    warnToRenderer(`[Printer] SumatraPDF command completed`);
    
    // IMPORTANT: Windows/SumatraPDF doesn't reliably report offline printers
    // The job goes to the spooler and appears "successful" even if printer is off
    // We just have to assume it worked - Windows will queue it until printer is back
    
  } catch (error: any) {
    console.error('[Printer] SumatraPDF execution failed:', error);
    warnToRenderer(`[Printer] SumatraPDF execution failed: ${error?.message}`);
    
    const errorMsg = error?.message || 'Unknown error';
    const stderr = error?.stderr || '';
    const stdout = error?.stdout || '';
    
    console.error('[Printer] Error details:', { errorMsg, stderr, stdout, code: error?.code });
    
    if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
      throw new Error('SUMATRA_TIMEOUT: Print timeout - printer offline or not reachable');
    }
    
    // Throw error with SUMATRA_ prefix to distinguish from "not found" errors
    throw new Error(`SUMATRA_PRINT_FAILED: Print failed for printer "${printerName}" - Error: ${errorMsg}`);
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

  console.warn('[Printer] ⚠️⚠️⚠️ Using Electron fallback method ⚠️⚠️⚠️');
  console.warn('[Printer] This may cause rendering issues with label printers (blank pages, black backgrounds, etc.)');
  console.warn('[Printer] SumatraPDF is the recommended printing method!');
  warnToRenderer('[Printer] ⚠️ SumatraPDF nicht gefunden - verwende Fallback-Methode. Dies kann zu leeren Seiten führen!');

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
    console.log(`[Printer] ----------------------------------------`);
    console.log(`[Printer] 🖨️ printPdf() called`);
    warnToRenderer(`[Printer] 🖨️ printPdf() called`);
    
    // Verify file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error('Label-Datei nicht gefunden');
    }
    console.log(`[Printer] ✅ PDF file exists: ${pdfPath}`);
    warnToRenderer(`[Printer] ✅ PDF file exists`);

    // If no printer specified, use default
    let targetPrinter = printerName;
    if (!targetPrinter) {
      targetPrinter = await getDefaultPrinter();
      if (!targetPrinter) {
        throw new Error('Kein Drucker ausgewählt');
      }
    }
    console.log(`[Printer] Target printer: ${targetPrinter}`);
    warnToRenderer(`[Printer] Target printer: ${targetPrinter}`);

    // Validate printer exists
    const availablePrinters = await listPrinters();
    const printerExists = availablePrinters.some(
      (p) => p.name === targetPrinter
    );
    if (!printerExists) {
      throw new Error(`Drucker "${targetPrinter}" nicht verfügbar`);
    }
    console.log(`[Printer] ✅ Printer validated`);
    warnToRenderer(`[Printer] ✅ Printer validated`);

    console.log(`[Printer] 📄 Printing: ${path.basename(pdfPath)}`);
    console.log(`[Printer] 🖨️  To printer: ${targetPrinter}`);
    warnToRenderer(`[Printer] 📄 Printing to: ${targetPrinter}`);

    // Try SumatraPDF first (preferred method for label printers)
    console.log(`[Printer] Attempting to print with SumatraPDF...`);
    warnToRenderer(`[Printer] Attempting to print with SumatraPDF...`);
    try {
      await printPdfWithSumatra(pdfPath, targetPrinter);
      console.log('[Printer] ✅ Successfully printed with SumatraPDF');
      warnToRenderer('[Printer] ✅ Successfully printed with SumatraPDF');
      console.log(`[Printer] ----------------------------------------`);
      return;
    } catch (sumatraError) {
      const errorMessage = sumatraError instanceof Error ? sumatraError.message : 'Unknown error';
      console.warn('[Printer] ⚠️ SumatraPDF failed:', errorMessage);
      warnToRenderer(`[Printer] ⚠️ SumatraPDF failed: ${errorMessage}`);
      
      // Only use Electron fallback if SumatraPDF was NOT FOUND
      // If SumatraPDF exists but printing failed, throw the error (don't use fallback)
      if (errorMessage.includes('nicht gefunden')) {
        console.warn('[Printer] ⚠️ SumatraPDF not found - Using Electron fallback');
        warnToRenderer('[Printer] ⚠️ SumatraPDF nicht gefunden - verwende Fallback-Methode. Dies kann zu leeren Seiten führen!');
        
        // Fall back to Electron method
        console.log(`[Printer] Attempting to print with Electron fallback...`);
        warnToRenderer(`[Printer] Attempting to print with Electron fallback...`);
        await printPdfWithElectron(pdfPath, targetPrinter);
        console.log('[Printer] ✅ Successfully printed with Electron fallback');
        warnToRenderer('[Printer] ✅ Successfully printed with Electron fallback');
        console.log(`[Printer] ----------------------------------------`);
      } else {
        // SumatraPDF exists but printing failed - this is a real error, don't use fallback
        console.error('[Printer] ❌ SumatraPDF found but printing failed - NOT using Electron fallback');
        warnToRenderer('[Printer] ❌ SumatraPDF printing failed - check printer connection!');
        console.log(`[Printer] ----------------------------------------`);
        throw sumatraError; // Re-throw the error
      }
    }
  } catch (error) {
    console.error('[Printer] ❌ All print methods failed:', error);
    warnToRenderer(`[Printer] ❌ All print methods failed: ${error}`);
    console.log(`[Printer] ----------------------------------------`);
    throw error;
  }
}
