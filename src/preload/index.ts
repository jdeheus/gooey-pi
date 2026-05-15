import { contextBridge, ipcRenderer } from "electron";
import type { GooeyPiApi } from "@shared/app-api";

const api: GooeyPiApi = {
  ping: () => ipcRenderer.invoke("gooey:ping"),
  getProjectFolderState: () => ipcRenderer.invoke("gooey:project-folder:get"),
  selectProjectFolder: () => ipcRenderer.invoke("gooey:project-folder:select"),
  validateProjectFolder: (path) => ipcRenderer.invoke("gooey:project-folder:validate", path),
  getPiRuntimeState: () => ipcRenderer.invoke("gooey:pi-runtime:get"),
  createAgentSession: (projectPath) => ipcRenderer.invoke("gooey:session:create", projectPath)
};

contextBridge.exposeInMainWorld("gooeyPi", api);
