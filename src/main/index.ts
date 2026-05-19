import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { join } from "node:path";
import type { PingResult } from "@shared/app-api";
import type {
  ChangeCheckpointResult,
  ChangeReviewDiffSnapshot,
  ChangeSummarySnapshot,
  CreateChangeCheckpointRequest,
  OpenChangeDiffResult,
  RestoreChangeCheckpointRequest,
  RestoreChangeCheckpointResult
} from "@shared/change-review";
import type { EventStreamClearScope, EventStreamSnapshot } from "@shared/events";
import type {
  AgentSessionSubmitRequest,
  AgentSessionSubmitResult,
  CreateAgentSessionResult,
  DisposeAgentSessionResult,
  PiModelCatalog,
  PiRuntimeSnapshot,
  StopAgentSessionResult
} from "@shared/pi";
import type { ProjectFolderSnapshot, SelectProjectFolderResult } from "@shared/project";
import type { RuntimeTaskGraphSnapshot } from "@shared/runtime-tasks";
import type { GitStatusSnapshot } from "@shared/github-automation";
import type { RuntimeSettingsPatch, RuntimeSettingsSnapshot } from "@shared/runtime-settings";
import type { SessionSnapshot } from "@shared/session";
import type {
  ToolApprovalAuditEntry,
  ToolApprovalResponseRequest,
  ToolApprovalResponseResult
} from "@shared/tool-approvals";
import { agentSessionManager } from "./agent-session-manager";
import {
  createChangeCheckpoint,
  getChangeReviewDiff,
  getChangeSummary,
  openChangeDiff,
  restoreChangeCheckpoint
} from "./change-review";
import {
  createChatRegistryChat,
  deleteChatRegistryChat,
  getChatRegistry,
  renameChatRegistryChat,
  restoreActiveChat,
  selectChatRegistryChat
} from "./chat-registry";
import { eventStream } from "./event-stream";
import { getGitStatus } from "./git-runtime";
import { getPiModelCatalog } from "./pi-model-catalog";
import { createProjectContextIndex } from "./project-context-index";
import { getPiRuntimeState } from "./pi-runtime";
import { restoreProjectFolder, selectProjectFolder, validateProjectFolder } from "./project-folders";
import { getRuntimeSettings, updateRuntimeSettings } from "./runtime-settings";
import { runStartupDiagnostics } from "./startup-diagnostics";
import { getToolApprovalAuditTrail, respondToToolApproval } from "./tool-approvals";
import type {
  ChatRegistryCreateRequest,
  ChatRegistryDeleteRequest,
  ChatRegistryMutationResult,
  ChatRegistryRenameRequest,
  ChatRegistryRestoreResult,
  ChatRegistrySelectRequest,
  ChatRegistrySnapshot
} from "@shared/chat-registry";

const isDevelopment = process.env.NODE_ENV === "development";

const userDataOverride = process.env.GOOEY_PI_USER_DATA_DIR?.trim();

if (userDataOverride) {
  app.setPath("userData", userDataOverride);
}

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
  return recordProjectContextIndex(await restoreProjectFolder());
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
    ...(await recordProjectContextIndex(await selectProjectFolder(result.filePaths[0]))),
    canceled: false
  };
});

ipcMain.handle("gooey:project-folder:select-path", async (_event, path: string): Promise<ProjectFolderSnapshot> => {
  const restored = await restoreProjectFolder();
  const isRegisteredProject = restored.registry.projects.some((project) => project.path === path);

  if (!isRegisteredProject) {
    throw new Error("Renderer project selection must use a registered project path.");
  }

  return recordProjectContextIndex(await selectProjectFolder(path));
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

ipcMain.handle("gooey:runtime-settings:get", async (): Promise<RuntimeSettingsSnapshot> => {
  return getRuntimeSettings();
});

ipcMain.handle(
  "gooey:runtime-settings:update",
  async (_event, patch: RuntimeSettingsPatch): Promise<RuntimeSettingsSnapshot> => {
    return updateRuntimeSettings(patch);
  }
);

ipcMain.handle("gooey:session:create", async (_event, projectPath: string): Promise<CreateAgentSessionResult> => {
  return agentSessionManager.create(projectPath);
});

ipcMain.handle("gooey:session:submit", async (_event, request: AgentSessionSubmitRequest): Promise<AgentSessionSubmitResult> => {
  return agentSessionManager.submitPrompt(request);
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

ipcMain.handle("gooey:runtime-tasks:get", (): RuntimeTaskGraphSnapshot => {
  return agentSessionManager.getRuntimeTaskGraph();
});

ipcMain.handle("gooey:git:status", async (): Promise<GitStatusSnapshot> => {
  const projectFolder = await restoreProjectFolder();

  if (!projectFolder.state.valid || !projectFolder.state.path) {
    throw new Error("Cannot read git status without a selected project.");
  }

  return getGitStatus(projectFolder.state.path);
});

ipcMain.handle("gooey:change-review:summary", async (): Promise<ChangeSummarySnapshot> => {
  const projectFolder = await restoreProjectFolder();

  if (!projectFolder.state.valid || !projectFolder.state.path) {
    throw new Error("Cannot summarize changes without a selected project.");
  }

  const summary = await getChangeSummary(projectFolder.state.path);
  eventStream.recordChangeSummary({
    branch: summary.branch,
    files: summary.files,
    id: `change-summary-${Date.now()}`,
    kind: "change.summary.created",
    summary: summary.summary,
    timestamp: summary.generatedAt,
    title: "Change summary"
  });
  return summary;
});

ipcMain.handle(
  "gooey:change-review:diff",
  async (_event, paths?: string[]): Promise<ChangeReviewDiffSnapshot> => {
    const projectFolder = await restoreProjectFolder();

    if (!projectFolder.state.valid || !projectFolder.state.path) {
      throw new Error("Cannot read change diff without a selected project.");
    }

    const diff = await getChangeReviewDiff(projectFolder.state.path, paths);
    eventStream.recordChangeDiff({
      files: diff.files,
      id: `change-diff-${Date.now()}`,
      kind: "change.diff.created",
      summary: "Optional Tier 2 diff review for the current change set.",
      timestamp: diff.generatedAt,
      title: "Change review"
    });
    return diff;
  }
);

ipcMain.handle(
  "gooey:change-review:open-diff",
  async (_event, path: string): Promise<OpenChangeDiffResult> => {
    const projectFolder = await restoreProjectFolder();

    if (!projectFolder.state.valid || !projectFolder.state.path) {
      return {
        error: {
          code: "project-unavailable",
          message: "Cannot open a change diff without a selected project."
        },
        ok: false
      };
    }

    return openChangeDiff(projectFolder.state.path, path);
  }
);

ipcMain.handle(
  "gooey:change-review:checkpoint",
  async (_event, request: CreateChangeCheckpointRequest): Promise<ChangeCheckpointResult> => {
    const projectFolder = await restoreProjectFolder();

    if (!projectFolder.state.valid || !projectFolder.state.path) {
      throw new Error("Cannot create checkpoint without a selected project.");
    }

    const result = await createChangeCheckpoint(projectFolder.state.path, request);
    eventStream.recordCheckpointRestoreRequest({
      checkpoint: result.checkpoint,
      files: result.checkpoint.status.files.map((file) => ({
        ...file,
        impact: "low",
        summary: "Captured in checkpoint."
      })),
      id: `checkpoint-restore-${Date.now()}`,
      kind: "change.checkpoint.restore.requested",
      summary: "Checkpoint captured before a risky change. You can restore it if needed.",
      timestamp: result.checkpoint.createdAt,
      title: "Checkpoint ready"
    });
    return result;
  }
);

ipcMain.handle(
  "gooey:change-review:restore",
  async (_event, request: RestoreChangeCheckpointRequest): Promise<RestoreChangeCheckpointResult> => {
    const projectFolder = await restoreProjectFolder();

    if (!projectFolder.state.valid || !projectFolder.state.path) {
      throw new Error("Cannot restore checkpoint without a selected project.");
    }

    const result = await restoreChangeCheckpoint(projectFolder.state.path, request);

    if (result.status !== "restored") {
      eventStream.recordChangeRecovery({
        id: `change-recovery-${Date.now()}`,
        kind: "change.recovery.created",
        recovery: {
          actions: [
            { id: "retry-undo", label: "Retry undo" },
            { id: "open-details", label: "Open details" }
          ],
          detail: result.errorMessage ?? "Checkpoint restore could not complete.",
          files: result.restoredFiles,
          id: `checkpoint-restore-${request.checkpointId}`,
          kind: result.status === "partial" ? "unmergeable" : "revert-failed",
          summary: "Checkpoint restore needs attention.",
          title: "Checkpoint restore failed"
        },
        timestamp: new Date().toISOString()
      });
    }

    return result;
  }
);

ipcMain.handle("gooey:tool-approvals:audit", (): ToolApprovalAuditEntry[] => {
  return getToolApprovalAuditTrail();
});

ipcMain.handle(
  "gooey:tool-approvals:respond",
  (_event, request: ToolApprovalResponseRequest): ToolApprovalResponseResult => {
    const result = respondToToolApproval(request);

    if (result.ok && result.auditEntry) {
      eventStream.recordToolApprovalDecision(result.auditEntry);
    }

    return result;
  }
);

ipcMain.handle("gooey:chat-registry:get", async (): Promise<ChatRegistrySnapshot> => {
  return getChatRegistry();
});

ipcMain.handle(
  "gooey:chat-registry:restore-active",
  async (_event, projectPath: string | null): Promise<ChatRegistryRestoreResult> => {
    return restoreActiveChat(projectPath);
  }
);

ipcMain.handle(
  "gooey:chat-registry:create",
  async (_event, request: ChatRegistryCreateRequest): Promise<ChatRegistryMutationResult> => {
    return createChatRegistryChat(request);
  }
);

ipcMain.handle(
  "gooey:chat-registry:rename",
  async (_event, request: ChatRegistryRenameRequest): Promise<ChatRegistryMutationResult> => {
    return renameChatRegistryChat(request);
  }
);

ipcMain.handle(
  "gooey:chat-registry:select",
  async (_event, request: ChatRegistrySelectRequest): Promise<ChatRegistryMutationResult> => {
    return selectChatRegistryChat(request);
  }
);

ipcMain.handle(
  "gooey:chat-registry:delete",
  async (_event, request: ChatRegistryDeleteRequest): Promise<ChatRegistryMutationResult> => {
    return deleteChatRegistryChat(request);
  }
);

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

async function recordProjectContextIndex(snapshot: ProjectFolderSnapshot): Promise<ProjectFolderSnapshot> {
  if (!snapshot.state.valid || !snapshot.state.path) {
    return snapshot;
  }

  const contextIndex = await createProjectContextIndex({
    projectId: snapshot.state.projectId ?? snapshot.state.path,
    projectPath: snapshot.state.path
  });
  eventStream.recordContextIndex(contextIndex);
  return snapshot;
}
