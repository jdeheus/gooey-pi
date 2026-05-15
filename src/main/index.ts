import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { join } from "node:path";
import type { PingResult } from "@shared/app-api";
import type { CreateAgentSessionResult, PiRuntimeSnapshot } from "@shared/pi";
import type { ProjectFolderSnapshot, SelectProjectFolderResult } from "@shared/project";
import type { SessionSnapshot } from "@shared/session";
import { agentSessionManager } from "./agent-session-manager";
import { ensurePiRuntimeReady, getPiRuntimeState } from "./pi-runtime";
import { restoreProjectFolder, selectProjectFolder, validateProjectFolder } from "./project-folders";

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

ipcMain.handle("gooey:project-folder:get", async (): Promise<ProjectFolderSnapshot> => {
  return restoreProjectFolder();
});

ipcMain.handle("gooey:project-folder:select", async (): Promise<SelectProjectFolderResult> => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory", "createDirectory"],
    title: "Select project folder",
    buttonLabel: "Select"
  });

  if (result.canceled || result.filePaths.length === 0) {
    const snapshot = await restoreProjectFolder();
    return {
      ...snapshot,
      canceled: true
    };
  }

  return {
    ...(await selectProjectFolder(result.filePaths[0])),
    canceled: false
  };
});

ipcMain.handle("gooey:project-folder:validate", async (_event, path: string) => {
  return validateProjectFolder(path);
});

ipcMain.handle("gooey:pi-runtime:get", async (): Promise<PiRuntimeSnapshot> => {
  return getPiRuntimeState();
});

ipcMain.handle("gooey:session:create", async (_event, projectPath: string): Promise<CreateAgentSessionResult> => {
  return agentSessionManager.create(projectPath);
});

ipcMain.handle("gooey:session:get", (): SessionSnapshot => {
  return agentSessionManager.getSnapshot();
});

app.whenReady().then(() => {
  createWindow();
  void ensurePiRuntimeReady();

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

app.on("before-quit", () => {
  void agentSessionManager.dispose();
});
