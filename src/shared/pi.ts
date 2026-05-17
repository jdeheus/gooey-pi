import type { AppError } from "./errors";
import type { ChatAttachment, ChatToken } from "./chat";
import type { SessionSnapshot } from "./session";

export type PiRuntimeStatus = "unchecked" | "starting" | "ready" | "errored";

export interface PiRuntimeSnapshot {
  status: PiRuntimeStatus;
  packageName: "@earendil-works/pi-coding-agent";
  packageVersion: "0.74.0";
  checkedAt: string | null;
  errorId: string | null;
  error: AppError | null;
}

export type PiModelThinkingLevel =
  | "off"
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | "xhigh";

export interface PiModelOption {
  id: string;
  label: string;
  thinkingLevels: PiModelThinkingLevel[];
}

export interface PiModelProvider {
  id: string;
  label: string;
  models: PiModelOption[];
}

export interface PiModelCatalog {
  providers: PiModelProvider[];
  defaultModelValue: string | null;
}

export interface CreateAgentSessionResult {
  session: SessionSnapshot;
  runtime: PiRuntimeSnapshot;
  error: AppError | null;
}

export type AgentSessionSubmitIntent = "queue" | "send" | "steer";

export type AgentSessionSubmitStatus =
  | "accepted"
  | "failed"
  | "queued"
  | "rejected"
  | "steered";

export interface AgentSessionSubmitModel {
  modelId: string;
  role: "primary";
  thinkingLevel?: PiModelThinkingLevel;
}

export interface AgentSessionSubmitRequest {
  attachments: ChatAttachment[];
  intent: AgentSessionSubmitIntent;
  model?: AgentSessionSubmitModel;
  planMode: boolean;
  selectedTokens: ChatToken[];
  text: string;
}

export interface AgentSessionSubmitResult {
  error: AppError | null;
  messageId: string | null;
  runId: string | null;
  session: SessionSnapshot;
  status: AgentSessionSubmitStatus;
}

export interface StopAgentSessionResult {
  session: SessionSnapshot;
  error: AppError | null;
}

export interface DisposeAgentSessionResult {
  session: SessionSnapshot;
  error: AppError | null;
}
