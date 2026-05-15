import type { ProjectFolderSnapshot, ProjectFolderValidation, SelectProjectFolderResult } from "./project";
import type { CreateAgentSessionResult, PiRuntimeSnapshot } from "./pi";

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
}
