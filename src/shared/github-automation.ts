export type GitAutomationOperation =
  | "commit"
  | "open-pr"
  | "pull"
  | "push"
  | "status";

export type GitAutomationErrorKind =
  | "auth"
  | "dirty-tree"
  | "failed-checks"
  | "network"
  | "pull-conflict"
  | "unknown";

export type GitChangedFileStatus =
  | "added"
  | "copied"
  | "deleted"
  | "modified"
  | "renamed"
  | "type-changed"
  | "unmerged"
  | "untracked";

export interface GitChangedFile {
  path: string;
  status: GitChangedFileStatus;
}

export interface GitStatusSnapshot {
  ahead: number;
  behind: number;
  branch: string | null;
  checkedAt: string;
  clean: boolean;
  files: GitChangedFile[];
  projectPath: string;
  remote: string | null;
}

export type VerificationCheckStatus =
  | "failed"
  | "passed"
  | "queued"
  | "running"
  | "skipped";

export type VerificationPipelineStatus =
  | "blocked"
  | "failed"
  | "passed"
  | "queued"
  | "running";

export interface VerificationCheckResult {
  command: string;
  durationLabel?: string;
  id: string;
  label: string;
  outputSummary?: string;
  status: VerificationCheckStatus;
}

export interface VerificationPipelineSnapshot {
  checks: VerificationCheckResult[];
  completedAt?: string;
  id: string;
  startedAt?: string;
  status: VerificationPipelineStatus;
}

export interface GitAutomationFailure {
  detail: string;
  kind: GitAutomationErrorKind;
  operation: GitAutomationOperation;
  recoveryAction: string;
  title: string;
}
