import { app, BrowserWindow, crashReporter } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { autoUpdater } from 'electron-updater';
import { getDatabase, closeDatabase } from './main/database/db';
import { registerAllHandlers } from './main/ipc/handlers';
import { logError, logInfo, logWarning, clearOldLogs, initializeLoggerExplicit } from './main/utils/logger';
import { setMainWindow } from './main/utils/renderer-logger';
import { startTokenRefresher } from './main/auth/token-refresher';
import { hasTokens } from './main/auth/token-storage';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Set Windows App User Model ID for proper icon display
// This ensures Windows correctly identifies the app and displays the right icon
if (process.platform === 'win32') {
  app.setAppUserModelId('com.autolabel.app');
}

// Initialize crash reporter
crashReporter.start({
  productName: 'AutoLabel',
  companyName: 'AutoLabel',
  submitURL: '', // No remote crash reporting - logs are stored locally
  uploadToServer: false,
});

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  console.error('[Main] Uncaught Exception:', error);
  logError('Uncaught Exception in Main Process', error, {
    type: 'uncaughtException',
  });
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('[Main] Unhandled Rejection at:', promise, 'reason:', reason);
  logError('Unhandled Promise Rejection in Main Process', reason, {
    type: 'unhandledRejection',
    promise: String(promise),
  });
});

// Configure auto-updater (only in production)
if (app.isPackaged) {
  // Configure update feed
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'JuliusSunder', // TODO: Replace with your GitHub username
    repo: 'AutoLabel_1',       // TODO: Replace with your repository name
  });

  // Log update events
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] No updates available. Current version:', info.version);
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`[AutoUpdater] Download progress: ${progressObj.percent}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version);
    // The update will be installed on app restart
    // You can show a notification to the user here
  });
}

// Initialize database and IPC handlers when app is ready
app.on('ready', () => {
  console.log('[Main] App ready, initializing...');
  
  // Initialize logger first
  initializeLoggerExplicit();
  
  logInfo('Application starting', { 
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    platform: process.platform,
  });

  // Clear old log files on startup
  try {
    clearOldLogs();
  } catch (error) {
    console.error('[Main] Failed to clear old logs:', error);
  }
  
  // Initialize database
  try {
    getDatabase();
    console.log('[Main] Database initialized successfully');
    logInfo('Database initialized successfully');
  } catch (error) {
    console.error('[Main] Failed to initialize database:', error);
    logError('Failed to initialize database', error);
  }

  // Register IPC handlers
  try {
    registerAllHandlers();
    logInfo('IPC handlers registered successfully');
  } catch (error) {
    console.error('[Main] Failed to register IPC handlers:', error);
    logError('Failed to register IPC handlers', error);
  }

  // Start token refresher if tokens exist (keeps login across restarts)
  try {
    if (hasTokens()) {
      startTokenRefresher();
      logInfo('Token refresher started on app launch');
    }
  } catch (error) {
    console.error('[Main] Failed to start token refresher:', error);
    logError('Failed to start token refresher', error);
  }

  // Create main window
  createWindow();

  // Check for updates after window is created (only in production)
  if (app.isPackaged) {
    // Wait a bit before checking for updates
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000);
  }
});

// Clean up on quit
app.on('will-quit', () => {
  console.log('App quitting, closing database...');
  logInfo('Application shutting down');
  closeDatabase();
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'AutoLabel',
    icon: path.join(__dirname, '../../icons/icon_256x256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Register main window for renderer logging
  setMainWindow(mainWindow);

  // Handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[Main] Renderer process crashed:', details);
    logError('Renderer process crashed', new Error('Renderer process gone'), {
      reason: details.reason,
      exitCode: details.exitCode,
    });
  });

  // Handle unresponsive renderer
  mainWindow.on('unresponsive', () => {
    console.warn('[Main] Window became unresponsive');
    logWarning('Window became unresponsive');
  });

  mainWindow.on('responsive', () => {
    console.log('[Main] Window became responsive again');
    logInfo('Window became responsive again');
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools only in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  logInfo('Main window created');
};

// Note: app.on('ready') is now at the top with initialization logic

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up main window reference on window close
app.on('window-all-closed', () => {
  setMainWindow(null);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
