// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { AutoLabelAPI } from './shared/types';

/**
 * Expose the AutoLabel API to the renderer process via contextBridge
 */
const autolabelAPI: AutoLabelAPI = {
  scan: {
    start: (accountId) => ipcRenderer.invoke('scan:start', accountId),
    status: () => ipcRenderer.invoke('scan:status'),
    refreshVinted: () => ipcRenderer.invoke('scan:refreshVinted'),
  },
  sales: {
    list: (params) => ipcRenderer.invoke('sales:list', params),
    get: (id) => ipcRenderer.invoke('sales:get', id),
  },
  labels: {
    prepare: (params) => ipcRenderer.invoke('labels:prepare', params),
    getThumbnail: (pdfPath) => ipcRenderer.invoke('labels:getThumbnail', pdfPath),
  },
  attachments: {
    getBySale: (saleId) => ipcRenderer.invoke('attachments:getBySale', saleId),
  },
  print: {
    addToQueue: (params) => ipcRenderer.invoke('print:addToQueue', params),
    start: (params) => ipcRenderer.invoke('print:start', params),
    startQueued: (jobId) => ipcRenderer.invoke('print:startQueued', jobId),
    status: (jobId) => ipcRenderer.invoke('print:status', jobId),
    listJobs: () => ipcRenderer.invoke('print:listJobs'),
    retry: (jobId) => ipcRenderer.invoke('print:retry', jobId),
    delete: (jobId) => ipcRenderer.invoke('print:delete', jobId),
    listPrinters: () => ipcRenderer.invoke('print:listPrinters'),
  },
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    set: (config) => ipcRenderer.invoke('config:set', config),
  },
  accounts: {
    list: () => ipcRenderer.invoke('accounts:list'),
    create: (data) => ipcRenderer.invoke('accounts:create', data),
    update: (id, data) => ipcRenderer.invoke('accounts:update', id, data),
    delete: (id) => ipcRenderer.invoke('accounts:delete', id),
    toggle: (id) => ipcRenderer.invoke('accounts:toggle', id),
    test: (config) => ipcRenderer.invoke('accounts:test', config),
    testExisting: (accountId) => ipcRenderer.invoke('accounts:testExisting', accountId),
  },
};

// Expose to window object
contextBridge.exposeInMainWorld('autolabel', autolabelAPI);
