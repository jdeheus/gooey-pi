import { contextBridge, ipcRenderer } from "electron";
import type { GooeyPiApi } from "@shared/app-api";

const api: GooeyPiApi = {
  ping: () => ipcRenderer.invoke("gooey:ping")
};

contextBridge.exposeInMainWorld("gooeyPi", api);
