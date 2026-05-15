import { contextBridge, ipcRenderer } from "electron";
import type { GooeyPiApi } from "@shared/app-api";
import type { EventStreamMessage } from "@shared/events";

const api: GooeyPiApi = {
  ping: () => ipcRenderer.invoke("gooey:ping"),
  getProjectFolderState: () => ipcRenderer.invoke("gooey:project-folder:get"),
  selectProjectFolder: () => ipcRenderer.invoke("gooey:project-folder:select"),
  validateProjectFolder: (path) => ipcRenderer.invoke("gooey:project-folder:validate", path),
  getPiRuntimeState: () => ipcRenderer.invoke("gooey:pi-runtime:get"),
  createAgentSession: (projectPath) => ipcRenderer.invoke("gooey:session:create", projectPath),
  sendPrompt: (text) => ipcRenderer.invoke("gooey:session:prompt", text),
  stopAgentSession: () => ipcRenderer.invoke("gooey:session:stop"),
  disposeAgentSession: () => ipcRenderer.invoke("gooey:session:dispose"),
  getEventStreamSnapshot: () => ipcRenderer.invoke("gooey:events:get"),
  clearEventStream: (scope) => ipcRenderer.invoke("gooey:events:clear", scope),
  onEventStreamMessage: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, message: EventStreamMessage) => {
      listener(message);
    };

    ipcRenderer.on("gooey:events:message", handler);

    return () => {
      ipcRenderer.removeListener("gooey:events:message", handler);
    };
  }
};

contextBridge.exposeInMainWorld("gooeyPi", api);
