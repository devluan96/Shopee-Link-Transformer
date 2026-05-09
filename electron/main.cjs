const fs = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow, nativeTheme, shell } = require("electron");

const APP_ID = "click.hotsnew.desktop";
const DEV_URL = process.env.ELECTRON_START_URL || "http://localhost:5173";
const PROD_URL = process.env.APP_BASE_URL || "https://hotsnew.click";
const DEFAULT_WINDOW_STATE = {
  width: 1440,
  height: 960,
};

let mainWindow = null;

function getWindowIconPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "icon.ico")
    : path.join(__dirname, "..", "desktop-assets", "icon.ico");
}

function getWindowStatePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState() {
  try {
    const raw = fs.readFileSync(getWindowStatePath(), "utf8");
    const parsed = JSON.parse(raw);
    return {
      width:
        typeof parsed.width === "number" && parsed.width >= 960
          ? parsed.width
          : DEFAULT_WINDOW_STATE.width,
      height:
        typeof parsed.height === "number" && parsed.height >= 680
          ? parsed.height
          : DEFAULT_WINDOW_STATE.height,
      x: typeof parsed.x === "number" ? parsed.x : undefined,
      y: typeof parsed.y === "number" ? parsed.y : undefined,
      isMaximized: parsed.isMaximized === true,
    };
  } catch {
    return {
      ...DEFAULT_WINDOW_STATE,
      x: undefined,
      y: undefined,
      isMaximized: false,
    };
  }
}

function saveWindowState(window) {
  if (!window || window.isDestroyed()) return;

  const bounds = window.getBounds();
  const state = {
    ...bounds,
    isMaximized: window.isMaximized(),
  };

  fs.mkdirSync(path.dirname(getWindowStatePath()), { recursive: true });
  fs.writeFileSync(getWindowStatePath(), JSON.stringify(state, null, 2));
}

function createWindow() {
  const backgroundColor = nativeTheme.shouldUseDarkColors
    ? "#0f172a"
    : "#f8fafc";
  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 960,
    minHeight: 680,
    show: false,
    center: windowState.x == null || windowState.y == null,
    autoHideMenuBar: true,
    backgroundColor,
    icon: getWindowIconPath(),
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

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (windowState.isMaximized) {
      mainWindow.maximize();
    }
  });

  const targetUrl = app.isPackaged ? PROD_URL : DEV_URL;
  mainWindow.loadURL(targetUrl);

  let saveTimeout = null;
  const scheduleWindowStateSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      saveWindowState(mainWindow);
    }, 160);
  };

  mainWindow.on("resize", scheduleWindowStateSave);
  mainWindow.on("move", scheduleWindowStateSave);
  mainWindow.on("maximize", scheduleWindowStateSave);
  mainWindow.on("unmaximize", scheduleWindowStateSave);
  mainWindow.on("close", () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveWindowState(mainWindow);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId(APP_ID);
  }

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
