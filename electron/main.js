const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Cosinotes',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },

    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for local storage operations
ipcMain.handle('read-notes', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const notesPath = path.join(userDataPath, 'notes.json');
    
    if (fs.existsSync(notesPath)) {
      const data = fs.readFileSync(notesPath, 'utf8');
      const parsed = JSON.parse(data);
      // Handle legacy format (array of notes)
      if (Array.isArray(parsed)) {
        return { notes: parsed, groups: [] };
      }
      return parsed;
    }
    return { notes: [], groups: [] };
  } catch (error) {
    console.error('Error reading notes:', error);
    return { notes: [], groups: [] };
  }
});

ipcMain.handle('save-notes', async (event, data) => {
  try {
    const userDataPath = app.getPath('userData');
    const notesPath = path.join(userDataPath, 'notes.json');
    
    fs.writeFileSync(notesPath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving notes:', error);
    return { success: false, error: error.message };
  }
});
