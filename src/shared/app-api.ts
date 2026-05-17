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
import type { SessionSnapshot } from "./session";
import type { RuntimeSettingsPatch, RuntimeSettingsSnapshot } from "./runtime-settings";

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
  validateProjectFolder(path: string): Promise<ProjectFolderValidation>;
  getPiRuntimeState(): Promise<PiRuntimeSnapshot>;
  getPiModelCatalog(): Promise<PiModelCatalog>;
  getRuntimeSettings(): Promise<RuntimeSettingsSnapshot>;
  updateRuntimeSettings(patch: RuntimeSettingsPatch): Promise<RuntimeSettingsSnapshot>;
  getAgentSession(): Promise<SessionSnapshot>;
  createAgentSession(projectPath: string): Promise<CreateAgentSessionResult>;
  submitPrompt(request: AgentSessionSubmitRequest): Promise<AgentSessionSubmitResult>;
  stopAgentSession(): Promise<StopAgentSessionResult>;
  disposeAgentSession(): Promise<DisposeAgentSessionResult>;
  getEventStreamSnapshot(): Promise<EventStreamSnapshot>;
  clearEventStream(scope?: EventStreamClearScope): Promise<EventStreamSnapshot>;
  onEventStreamMessage(listener: (message: EventStreamMessage) => void): () => void;
}
