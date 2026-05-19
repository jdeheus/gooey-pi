export type OperatorRunStage =
  | "accepted"
  | "automating"
  | "completed"
  | "needs-attention"
  | "resumable"
  | "running"
  | "verifying"
  | "waiting-approval";

export type OperatorRunStepStatus =
  | "blocked"
  | "completed"
  | "needs-attention"
  | "queued"
  | "running"
  | "skipped";

export interface OperatorRunReference {
  id: string;
  kind:
    | "approval"
    | "background-task"
    | "change-summary"
    | "github-automation"
    | "subagent-chain"
    | "verification";
  label: string;
}

export interface OperatorRunAction {
  id: string;
  label: string;
  tone?: "danger" | "default" | "primary";
}

export interface OperatorRunStep {
  detail?: string;
  id: string;
  reference?: OperatorRunReference;
  status: OperatorRunStepStatus;
  summary?: string;
  title: string;
}

export interface OperatorRunRecovery {
  actionLabel?: string;
  detail: string;
  reason: "app-restarted" | "blocked" | "checks-failed" | "manual-pause" | "runtime-reconnect";
  title: string;
}

export interface OperatorRunSnapshot {
  actions?: OperatorRunAction[];
  activeStepId?: string;
  chatId?: string;
  completedAtLabel?: string;
  id: string;
  objective: string;
  projectId?: string;
  projectLabel?: string;
  recovery?: OperatorRunRecovery;
  runId?: string;
  stage: OperatorRunStage;
  startedAtLabel?: string;
  steps: OperatorRunStep[];
  summary: string;
  title: string;
}
