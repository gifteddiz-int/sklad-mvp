import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import started from 'electron-squirrel-startup';

if (started) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

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

// Обработка закрытия приложения
app.on('before-quit', () => {
  console.log('Приложение закрывается...');
});

// ---- File-based storage (daily JSON files) ----
const getUserDir = () => app.getPath('userData');
const getDataDir = () => path.join(getUserDir(), 'data');
const getSettingsPath = () => path.join(getUserDir(), 'settings.json');
const getTodayFilePath = () => {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(getDataDir(), `session_${date}.json`);
};

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

ipcMain.handle('fileStore:saveSession', async (_evt, data) => {
  const dir = getDataDir();
  await ensureDir(dir);
  const filePath = getTodayFilePath();
  const payload = { ...data, lastSave: new Date().toISOString() };
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  return { filePath };
});

ipcMain.handle('fileStore:loadLatestSession', async () => {
  const dir = getDataDir();
  try {
    await ensureDir(dir);
    const files = await fs.readdir(dir);
    const sessionFiles = files
      .filter((f) => /^session_\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort() // ascending by date string
      .reverse(); // latest first
    if (sessionFiles.length === 0) return null;
    const latestPath = path.join(dir, sessionFiles[0]);
    const raw = await fs.readFile(latestPath, 'utf-8');
    const json = JSON.parse(raw);
    return { ...json };
  } catch (_e) {
    return null;
  }
});

ipcMain.handle('fileStore:clearSession', async () => {
  const filePath = getTodayFilePath();
  try {
    await fs.unlink(filePath);
  } catch (_e) {
    // ignore if not exists
  }
});

ipcMain.handle('fileStore:saveSettings', async (_evt, settings) => {
  const filePath = getSettingsPath();
  await ensureDir(getUserDir());
  await fs.writeFile(filePath, JSON.stringify(settings ?? {}, null, 2), 'utf-8');
});

ipcMain.handle('fileStore:loadSettings', async () => {
  const filePath = getSettingsPath();
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
});
