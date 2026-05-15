import type { ProjectFolderSnapshot, ProjectFolderValidation, SelectProjectFolderResult } from "./project";
import type { CreateAgentSessionResult, PiRuntimeSnapshot, SendPromptResult } from "./pi";
import type { EventStreamMessage, EventStreamSnapshot } from "./events";

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
  createAgentSession(projectPath: string): Promise<CreateAgentSessionResult>;
  sendPrompt(text: string): Promise<SendPromptResult>;
  getEventStreamSnapshot(): Promise<EventStreamSnapshot>;
  clearEventStream(): Promise<EventStreamSnapshot>;
  onEventStreamMessage(listener: (message: EventStreamMessage) => void): () => void;
}
