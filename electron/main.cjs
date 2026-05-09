const { app, BrowserWindow, nativeTheme, shell } = require("electron");

const DEV_URL = process.env.ELECTRON_START_URL || "http://localhost:5173";
const PROD_URL = process.env.APP_BASE_URL || "https://hotsnew.click";

let mainWindow = null;

function createWindow() {
  const backgroundColor = nativeTheme.shouldUseDarkColors
    ? "#0f172a"
    : "#f8fafc";

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    autoHideMenuBar: true,
    backgroundColor,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const targetUrl = app.isPackaged ? PROD_URL : DEV_URL;
  mainWindow.loadURL(targetUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
