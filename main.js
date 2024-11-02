const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize electron store
const store = new Store();

function createWindow() {
  // Create the browser window
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the index.html file
  win.loadFile('index.html');

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

// Create window when app is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Create a new window if none exist (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle note saving
ipcMain.handle('save-note', async (event, note) => {
  const notes = store.get('notes', []);
  
  if (note.id) {
    // Update existing note
    const index = notes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      notes[index] = note;
    }
  } else {
    // Add new note
    note.id = Date.now();
    notes.push(note);
  }
  
  store.set('notes', notes);
  return notes;
});

// Handle notes loading
ipcMain.handle('load-notes', async () => {
  return store.get('notes', []);
});