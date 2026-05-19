export type RuntimeContextBudgetStatus = "normal" | "warning" | "critical" | "compacting";

export interface RuntimeUsageProviderBreakdown {
  cost: number;
  provider: string;
  tokens: number;
}

export interface RuntimeUsageCompactionSnapshot {
  id: string;
  providerCosts: RuntimeUsageProviderBreakdown[];
  timestampLabel?: string;
  title: string;
}

export interface RuntimeUsageSnapshot {
  billingSources: ("api" | "subscription")[];
  compactions: RuntimeUsageCompactionSnapshot[];
  contextLimitTokens?: number;
  contextPercent: number;
  contextStatus: RuntimeContextBudgetStatus;
  cost: number;
  isCompacting?: boolean;
  tokens: number;
  updatedAt: string;
}

export type BackgroundTaskStatus =
  | "completed"
  | "needs-attention"
  | "resumable"
  | "running";

export interface BackgroundTaskSnapshot {
  detail?: string;
  id: string;
  projectLabel?: string;
  relatedChatId?: string;
  relatedRunId?: string;
  status: BackgroundTaskStatus;
  summary: string;
  title: string;
  updatedAt: string;
}

export interface NotificationReadyEvent {
  backgroundTaskId?: string;
  id: string;
  projectLabel?: string;
  severity: "info" | "success" | "warning" | "error";
  summary: string;
  timestamp: string;
  title: string;
}

export function createEmptyRuntimeUsageSnapshot(now = new Date().toISOString()): RuntimeUsageSnapshot {
  return {
    billingSources: [],
    compactions: [],
    contextPercent: 0,
    contextStatus: "normal",
    cost: 0,
    tokens: 0,
    updatedAt: now
  };
}
