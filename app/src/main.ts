import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { autoUpdater } from 'electron-updater';
import { getDatabase, closeDatabase } from './main/database/db';
import { registerAllHandlers } from './main/ipc/handlers';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Configure auto-updater (only in production)
if (app.isPackaged) {
  // Configure update feed
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'your-username', // TODO: Replace with your GitHub username
    repo: 'autolabel',       // TODO: Replace with your repository name
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
  
  // Initialize database
  try {
    getDatabase();
    console.log('[Main] Database initialized successfully');
  } catch (error) {
    console.error('[Main] Failed to initialize database:', error);
  }

  // Register IPC handlers
  registerAllHandlers();

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
  closeDatabase();
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'AutoLabel',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
