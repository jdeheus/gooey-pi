import type { AppError } from "./errors";
import type { RuntimeTranscriptSnapshot } from "./transcript";

export type ChatRegistryDeleteMode = "delete" | "hide";

export type ChatRegistryRestoreFallbackReason =
  | "hidden-selected-chat"
  | "missing-selected-chat"
  | "no-project"
  | "no-selected-chat";

export interface ChatRegistryChat {
  createdAt: string;
  hiddenAt: string | null;
  id: string;
  projectPath: string;
  sessionFile: string | null;
  sessionId: string | null;
  title: string;
  updatedAt: string;
}

export interface ChatRegistryProject {
  activeChatId: string | null;
  chats: ChatRegistryChat[];
  name: string;
  path: string;
  updatedAt: string;
}

export interface ChatRegistrySnapshot {
  projects: ChatRegistryProject[];
  updatedAt: string | null;
}

export interface ChatRegistryCreateRequest {
  projectPath: string;
  sessionFile?: string | null;
  sessionId?: string | null;
  title?: string;
}

export interface ChatRegistryRenameRequest {
  chatId: string;
  title: string;
}

export interface ChatRegistrySelectRequest {
  chatId: string | null;
  projectPath: string;
}

export interface ChatRegistryDeleteRequest {
  chatId: string;
  mode?: ChatRegistryDeleteMode;
  projectPath?: string;
}

export interface ChatRegistryMutationResult {
  chat: ChatRegistryChat | null;
  error: AppError | null;
  snapshot: ChatRegistrySnapshot;
}

export interface ChatRegistryRestoreResult {
  activeChatId: string | null;
  chat: ChatRegistryChat | null;
  error: AppError | null;
  fallbackReason: ChatRegistryRestoreFallbackReason | null;
  projectPath: string | null;
  recoveryNotice: string | null;
  snapshot: ChatRegistrySnapshot;
  transcript: RuntimeTranscriptSnapshot | null;
}
