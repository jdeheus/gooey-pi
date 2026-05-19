import { contextBridge, ipcRenderer } from "electron";
import type { GooeyPiApi } from "@shared/app-api";
import type { EventStreamMessage } from "@shared/events";

const api: GooeyPiApi = {
  ping: () => ipcRenderer.invoke("gooey:ping"),
  getProjectFolderState: () => ipcRenderer.invoke("gooey:project-folder:get"),
  selectProjectFolder: () => ipcRenderer.invoke("gooey:project-folder:select"),
  selectProjectPath: (path) => ipcRenderer.invoke("gooey:project-folder:select-path", path),
  validateProjectFolder: (path) => ipcRenderer.invoke("gooey:project-folder:validate", path),
  getPiRuntimeState: () => ipcRenderer.invoke("gooey:pi-runtime:get"),
  getPiModelCatalog: () => ipcRenderer.invoke("gooey:pi-models:get"),
  getRuntimeSettings: () => ipcRenderer.invoke("gooey:runtime-settings:get"),
  updateRuntimeSettings: (patch) => ipcRenderer.invoke("gooey:runtime-settings:update", patch),
  getAgentSession: () => ipcRenderer.invoke("gooey:session:get"),
  getRuntimeTaskGraph: () => ipcRenderer.invoke("gooey:runtime-tasks:get"),
  getGitStatus: () => ipcRenderer.invoke("gooey:git:status"),
  getChangeSummary: () => ipcRenderer.invoke("gooey:change-review:summary"),
  getChangeReviewDiff: (paths) => ipcRenderer.invoke("gooey:change-review:diff", paths),
  openChangeDiff: (path) => ipcRenderer.invoke("gooey:change-review:open-diff", path),
  createChangeCheckpoint: (request) => ipcRenderer.invoke("gooey:change-review:checkpoint", request),
  restoreChangeCheckpoint: (request) => ipcRenderer.invoke("gooey:change-review:restore", request),
  getToolApprovalAuditTrail: () => ipcRenderer.invoke("gooey:tool-approvals:audit"),
  respondToToolApproval: (request) => ipcRenderer.invoke("gooey:tool-approvals:respond", request),
  getChatRegistry: () => ipcRenderer.invoke("gooey:chat-registry:get"),
  restoreActiveChat: (projectPath) => ipcRenderer.invoke("gooey:chat-registry:restore-active", projectPath),
  createChatRegistryChat: (request) => ipcRenderer.invoke("gooey:chat-registry:create", request),
  renameChatRegistryChat: (request) => ipcRenderer.invoke("gooey:chat-registry:rename", request),
  selectChatRegistryChat: (request) => ipcRenderer.invoke("gooey:chat-registry:select", request),
  deleteChatRegistryChat: (request) => ipcRenderer.invoke("gooey:chat-registry:delete", request),
  createAgentSession: (projectPath) => ipcRenderer.invoke("gooey:session:create", projectPath),
  submitPrompt: (request) => ipcRenderer.invoke("gooey:session:submit", request),
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
