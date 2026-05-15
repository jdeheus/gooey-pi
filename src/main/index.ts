import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import type { PingResult } from "@shared/app-api";

const isDevelopment = process.env.NODE_ENV === "development";

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1240,
    height: 800,
    minWidth: 1040,
    minHeight: 680,
    title: "Gooey Pi",
    backgroundColor: "#0f1115",
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDevelopment && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

ipcMain.handle("gooey:ping", (): PingResult => {
  return {
    ok: true,
    app: "gooey-pi",
    source: "main",
    timestamp: new Date().toISOString()
  };
});

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
