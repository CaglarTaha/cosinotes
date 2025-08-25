const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  readNotes: () => ipcRenderer.invoke('read-notes'),
  saveNotes: (notes) => ipcRenderer.invoke('save-notes', notes),
  platform: process.platform
});
