import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { join } from "node:path";
import type { PingResult } from "@shared/app-api";
import type { EventStreamClearScope, EventStreamSnapshot } from "@shared/events";
import type {
  CreateAgentSessionResult,
  DisposeAgentSessionResult,
  PiModelCatalog,
  PiRuntimeSnapshot,
  SendPromptResult,
  StopAgentSessionResult
} from "@shared/pi";
import type { ProjectFolderSnapshot, SelectProjectFolderResult } from "@shared/project";
import type { SessionSnapshot } from "@shared/session";
import { agentSessionManager } from "./agent-session-manager";
import { eventStream } from "./event-stream";
import { getPiModelCatalog } from "./pi-model-catalog";
import { getPiRuntimeState } from "./pi-runtime";
import { restoreProjectFolder, selectProjectFolder, validateProjectFolder } from "./project-folders";
import { runStartupDiagnostics } from "./startup-diagnostics";

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

  eventStream.registerTarget(mainWindow.webContents);

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

ipcMain.handle("gooey:pi-models:get", async (): Promise<PiModelCatalog> => {
  return getPiModelCatalog();
});

ipcMain.handle("gooey:session:create", async (_event, projectPath: string): Promise<CreateAgentSessionResult> => {
  return agentSessionManager.create(projectPath);
});

ipcMain.handle("gooey:session:prompt", (_event, text: string): SendPromptResult => {
  return agentSessionManager.sendPrompt(text);
});

ipcMain.handle("gooey:session:stop", async (): Promise<StopAgentSessionResult> => {
  return agentSessionManager.stopActiveRun();
});

ipcMain.handle("gooey:session:dispose", async (): Promise<DisposeAgentSessionResult> => {
  return agentSessionManager.disposeActiveSession();
});

ipcMain.handle("gooey:session:get", (): SessionSnapshot => {
  return agentSessionManager.getSnapshot();
});

ipcMain.handle("gooey:events:get", (): EventStreamSnapshot => {
  return eventStream.getSnapshot();
});

ipcMain.handle("gooey:events:clear", (_event, scope?: EventStreamClearScope): EventStreamSnapshot => {
  return eventStream.clear(scope);
});

app.whenReady().then(() => {
  createWindow();
  void runStartupDiagnostics();

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
