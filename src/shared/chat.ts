export type ChatAttachmentKind = "file" | "image";

export interface ChatAttachment {
  description?: string;
  id: string;
  kind: ChatAttachmentKind;
  mimeType?: string;
  name: string;
  previewUrl?: string;
  sizeLabel?: string;
}

export type ChatCommandSource = "builtin" | "extension" | "prompt" | "skill";

export interface ChatCommandOption {
  description?: string;
  id: string;
  name: string;
  shortcut?: string;
  source: ChatCommandSource;
}

export type ChatMentionKind = "file" | "resource" | "skill";

export interface ChatMentionOption {
  description?: string;
  id: string;
  kind: ChatMentionKind;
  label: string;
  path?: string;
}

export type ChatRunStatus =
  | "cancelled"
  | "complete"
  | "error"
  | "queued"
  | "running"
  | "working";

export type ChatToolName =
  | "bash"
  | "edit"
  | "find"
  | "grep"
  | "ls"
  | "read"
  | "write";

export type ChatBillingSource = "api" | "subscription";

export interface ChatSessionMetrics {
  billingLabel?: string;
  billingSources?: ChatBillingSource[];
  compactions?: ChatCompactionCostEntry[];
  contextPercent: number;
  cost: number;
  isCompacting?: boolean;
  isUnavailable?: boolean;
  tokens?: number;
}

export interface ChatProviderCost {
  cost: number;
  provider: string;
  tokens?: number;
}

export interface ChatCompactionCostEntry {
  id: string;
  providerCosts: ChatProviderCost[];
  timestampLabel?: string;
  title: string;
}

export interface ChatToken {
  id: string;
  kind: "command" | "mention";
  label: string;
}

export interface ChatBaseItem {
  costLabel?: string;
  id: string;
  timestampLabel?: string;
}

export interface ChatMessageItem extends ChatBaseItem {
  attachments?: ChatAttachment[];
  content: string;
  kind: "assistant-message" | "user-message";
  modelLabel?: string;
  providerLabel?: string;
  thinkingLevelLabel?: string;
}

export interface ChatToolActionItem extends ChatBaseItem {
  commandLabel?: string;
  detail?: string;
  kind: "tool-action";
  path?: string;
  status: ChatRunStatus;
  summary: string;
  title: string;
  toolName: ChatToolName;
  truncated?: boolean;
}

export interface ChatThinkingItem extends ChatBaseItem {
  defaultOpen?: boolean;
  detail: string;
  kind: "thinking";
  status: ChatRunStatus;
  summary: string;
  title: string;
}

export interface ChatCompactionNoticeItem extends ChatBaseItem {
  detail?: string;
  kind: "compaction-notice";
  status: Extract<ChatRunStatus, "complete" | "error" | "running">;
  summary: string;
  title: string;
}

export interface ChatCustomSurfaceItem extends ChatBaseItem {
  customType: string;
  description: string;
  detailLines?: string[];
  kind: "custom-surface";
  status?: ChatRunStatus;
  title: string;
}

export interface ChatSubagent {
  durationLabel?: string;
  id: string;
  model?: string;
  name: string;
  role: string;
  status: ChatRunStatus;
  toolsLabel?: string;
}

export interface ChatSubagentChainItem extends ChatBaseItem {
  agents: ChatSubagent[];
  kind: "subagent-chain";
  status: ChatRunStatus;
  summary?: string;
  title: string;
}

export interface ChatSummaryItem extends ChatBaseItem {
  content: string;
  kind: "summary";
  summaryType: "branch" | "compaction";
  title: string;
}

export interface ChatErrorItem extends ChatBaseItem {
  detail?: string;
  kind: "error";
  message: string;
  title: string;
}

export type ChatItem =
  | ChatCompactionNoticeItem
  | ChatCustomSurfaceItem
  | ChatErrorItem
  | ChatMessageItem
  | ChatSubagentChainItem
  | ChatSummaryItem
  | ChatThinkingItem
  | ChatToolActionItem;
