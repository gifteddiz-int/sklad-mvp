import { contextBridge, ipcRenderer } from 'electron';

// Expose a minimal, safe API for file-based storage
contextBridge.exposeInMainWorld('fileStore', {
  saveSession: (data) => ipcRenderer.invoke('fileStore:saveSession', data),
  loadLatestSession: () => ipcRenderer.invoke('fileStore:loadLatestSession'),
  clearSession: () => ipcRenderer.invoke('fileStore:clearSession'),
  saveSettings: (settings) => ipcRenderer.invoke('fileStore:saveSettings', settings),
  loadSettings: () => ipcRenderer.invoke('fileStore:loadSettings'),
});
