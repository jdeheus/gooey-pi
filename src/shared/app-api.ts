import type { ProjectFolderSnapshot, ProjectFolderValidation, SelectProjectFolderResult } from "./project";
import type {
  AgentSessionSubmitRequest,
  AgentSessionSubmitResult,
  CreateAgentSessionResult,
  DisposeAgentSessionResult,
  PiModelCatalog,
  PiRuntimeSnapshot,
  StopAgentSessionResult
} from "./pi";
import type { EventStreamClearScope, EventStreamMessage, EventStreamSnapshot } from "./events";
import type { RuntimeTaskGraphSnapshot } from "./runtime-tasks";
import type { SessionSnapshot } from "./session";
import type { RuntimeSettingsPatch, RuntimeSettingsSnapshot } from "./runtime-settings";
import type { GitStatusSnapshot } from "./github-automation";
import type {
  ChangeCheckpointResult,
  ChangeReviewDiffSnapshot,
  ChangeSummarySnapshot,
  CreateChangeCheckpointRequest,
  OpenChangeDiffResult,
  RestoreChangeCheckpointRequest,
  RestoreChangeCheckpointResult
} from "./change-review";
import type {
  ToolApprovalAuditEntry,
  ToolApprovalResponseRequest,
  ToolApprovalResponseResult
} from "./tool-approvals";
import type {
  ChatRegistryCreateRequest,
  ChatRegistryDeleteRequest,
  ChatRegistryMutationResult,
  ChatRegistryRenameRequest,
  ChatRegistryRestoreResult,
  ChatRegistrySelectRequest,
  ChatRegistrySnapshot
} from "./chat-registry";

export interface PingResult {
  ok: true;
  app: "gooey-pi";
  source: "main";
  timestamp: string;
}

export interface GooeyPiApi {
  ping(): Promise<PingResult>;
  getProjectFolderState(): Promise<ProjectFolderSnapshot>;
  selectProjectFolder(): Promise<SelectProjectFolderResult>;
  selectProjectPath(path: string): Promise<ProjectFolderSnapshot>;
  validateProjectFolder(path: string): Promise<ProjectFolderValidation>;
  getPiRuntimeState(): Promise<PiRuntimeSnapshot>;
  getPiModelCatalog(): Promise<PiModelCatalog>;
  getRuntimeSettings(): Promise<RuntimeSettingsSnapshot>;
  updateRuntimeSettings(patch: RuntimeSettingsPatch): Promise<RuntimeSettingsSnapshot>;
  getAgentSession(): Promise<SessionSnapshot>;
  getRuntimeTaskGraph(): Promise<RuntimeTaskGraphSnapshot>;
  getGitStatus(): Promise<GitStatusSnapshot>;
  getChangeSummary(): Promise<ChangeSummarySnapshot>;
  getChangeReviewDiff(paths?: string[]): Promise<ChangeReviewDiffSnapshot>;
  openChangeDiff(path: string): Promise<OpenChangeDiffResult>;
  createChangeCheckpoint(request: CreateChangeCheckpointRequest): Promise<ChangeCheckpointResult>;
  restoreChangeCheckpoint(request: RestoreChangeCheckpointRequest): Promise<RestoreChangeCheckpointResult>;
  getToolApprovalAuditTrail(): Promise<ToolApprovalAuditEntry[]>;
  respondToToolApproval(request: ToolApprovalResponseRequest): Promise<ToolApprovalResponseResult>;
  getChatRegistry(): Promise<ChatRegistrySnapshot>;
  restoreActiveChat(projectPath: string | null): Promise<ChatRegistryRestoreResult>;
  createChatRegistryChat(request: ChatRegistryCreateRequest): Promise<ChatRegistryMutationResult>;
  renameChatRegistryChat(request: ChatRegistryRenameRequest): Promise<ChatRegistryMutationResult>;
  selectChatRegistryChat(request: ChatRegistrySelectRequest): Promise<ChatRegistryMutationResult>;
  deleteChatRegistryChat(request: ChatRegistryDeleteRequest): Promise<ChatRegistryMutationResult>;
  createAgentSession(projectPath: string): Promise<CreateAgentSessionResult>;
  submitPrompt(request: AgentSessionSubmitRequest): Promise<AgentSessionSubmitResult>;
  stopAgentSession(): Promise<StopAgentSessionResult>;
  disposeAgentSession(): Promise<DisposeAgentSessionResult>;
  getEventStreamSnapshot(): Promise<EventStreamSnapshot>;
  clearEventStream(scope?: EventStreamClearScope): Promise<EventStreamSnapshot>;
  onEventStreamMessage(listener: (message: EventStreamMessage) => void): () => void;
}
