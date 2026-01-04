/**
 * Folders IPC Handlers
 * Handle watched folder management
 */

import { ipcMain, dialog } from 'electron';
import type { WatchedFolder } from '../../shared/types';
import {
  getAllWatchedFolders,
  createWatchedFolder,
  updateWatchedFolder,
  deleteWatchedFolder,
  toggleFolderActive,
  folderExistsByPath,
} from '../database/repositories/watched-folders';
import { logError, logInfo, logDebug } from '../utils/logger';
import { getUserFriendlyError } from '../utils/error-messages';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Register folder IPC handlers
 */
export function registerFolderHandlers(): void {
  // List all watched folders
  ipcMain.handle('folders:list', async (): Promise<WatchedFolder[]> => {
    console.log('[IPC] folders:list called');

    try {
      const folders = getAllWatchedFolders();
      return folders;
    } catch (error) {
      console.error('[IPC] Error listing folders:', error);
      throw error;
    }
  });

  // Create new watched folder
  ipcMain.handle('folders:create', async (_event, data: Omit<WatchedFolder, 'id' | 'createdAt'>): Promise<WatchedFolder> => {
    console.log('[IPC] folders:create called');
    logInfo('Creating watched folder', { 
      name: data.name,
      folderPath: data.folderPath,
    });

    try {
      // Validate folder path
      if (!path.isAbsolute(data.folderPath)) {
        throw new Error('Folder path must be absolute');
      }

      // Check if folder exists
      if (!fs.existsSync(data.folderPath)) {
        throw new Error(`Folder does not exist: ${data.folderPath}`);
      }

      // Check if it's actually a directory
      const stats = fs.statSync(data.folderPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${data.folderPath}`);
      }

      // Check for duplicate path
      if (folderExistsByPath(data.folderPath)) {
        throw new Error(`Ein Ordner mit diesem Pfad wird bereits überwacht: ${data.folderPath}`);
      }

      const folder = createWatchedFolder(data);
      console.log(`[IPC] Created watched folder: ${folder.id}`);
      logInfo('Watched folder created', { 
        folderId: folder.id,
        name: folder.name,
        folderPath: folder.folderPath,
      });
      
      return folder;
    } catch (error) {
      console.error('[IPC] Error creating folder:', error);
      logError('Failed to create watched folder', error, { 
        name: data.name,
        folderPath: data.folderPath,
      });
      
      const userFriendlyMessage = getUserFriendlyError(error);
      throw new Error(userFriendlyMessage);
    }
  });

  // Update watched folder
  ipcMain.handle('folders:update', async (_event, id: string, data: Partial<Omit<WatchedFolder, 'id' | 'createdAt'>>): Promise<void> => {
    console.log('[IPC] folders:update called for folder:', id);

    try {
      // If folder path is being changed, validate it
      if (data.folderPath) {
        if (!path.isAbsolute(data.folderPath)) {
          throw new Error('Folder path must be absolute');
        }

        if (!fs.existsSync(data.folderPath)) {
          throw new Error(`Folder does not exist: ${data.folderPath}`);
        }

        const stats = fs.statSync(data.folderPath);
        if (!stats.isDirectory()) {
          throw new Error(`Path is not a directory: ${data.folderPath}`);
        }

        // Check for duplicate path (excluding current folder)
        if (folderExistsByPath(data.folderPath, id)) {
          throw new Error(`A folder with this path is already being watched: ${data.folderPath}`);
        }
      }

      updateWatchedFolder(id, data);
      console.log(`[IPC] Updated watched folder: ${id}`);
    } catch (error) {
      console.error('[IPC] Error updating folder:', error);
      throw error;
    }
  });

  // Delete watched folder
  ipcMain.handle('folders:delete', async (_event, id: string): Promise<void> => {
    console.log('[IPC] folders:delete called for folder:', id);

    try {
      deleteWatchedFolder(id);
      console.log(`[IPC] Deleted watched folder: ${id}`);
    } catch (error) {
      console.error('[IPC] Error deleting folder:', error);
      throw error;
    }
  });

  // Toggle folder active status
  ipcMain.handle('folders:toggle', async (_event, id: string): Promise<void> => {
    console.log('[IPC] folders:toggle called for folder:', id);

    try {
      toggleFolderActive(id);
      console.log(`[IPC] Toggled folder active status: ${id}`);
    } catch (error) {
      console.error('[IPC] Error toggling folder:', error);
      throw error;
    }
  });

  // Choose folder dialog
  ipcMain.handle('folders:chooseFolder', async (): Promise<{ success: boolean; path?: string; error?: string }> => {
    console.log('[IPC] folders:chooseFolder called');

    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Choose Folder to Watch',
        buttonLabel: 'Select Folder',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false };
      }

      const selectedPath = result.filePaths[0];
      console.log(`[IPC] User selected folder: ${selectedPath}`);
      
      return { 
        success: true, 
        path: selectedPath,
      };
    } catch (error) {
      console.error('[IPC] Error choosing folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}

