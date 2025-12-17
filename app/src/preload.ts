// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { AutoLabelAPI } from './shared/types';

/**
 * Expose the AutoLabel API to the renderer process via contextBridge
 */
const autolabelAPI: AutoLabelAPI = {
  scan: {
    start: () => ipcRenderer.invoke('scan:start'),
    status: () => ipcRenderer.invoke('scan:status'),
  },
  sales: {
    list: (params) => ipcRenderer.invoke('sales:list', params),
    get: (id) => ipcRenderer.invoke('sales:get', id),
  },
  labels: {
    prepare: (params) => ipcRenderer.invoke('labels:prepare', params),
  },
  print: {
    start: (params) => ipcRenderer.invoke('print:start', params),
    status: (jobId) => ipcRenderer.invoke('print:status', jobId),
    listPrinters: () => ipcRenderer.invoke('print:listPrinters'),
  },
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    set: (config) => ipcRenderer.invoke('config:set', config),
  },
};

// Expose to window object
contextBridge.exposeInMainWorld('autolabel', autolabelAPI);
