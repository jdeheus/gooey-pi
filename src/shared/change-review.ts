import type { GitChangedFile, GitStatusSnapshot } from "./github-automation";

export type ChangeReviewFileImpact = "high" | "low" | "medium";

export interface ChangeReviewFile extends GitChangedFile {
  additions?: number;
  deletions?: number;
  impact: ChangeReviewFileImpact;
  summary: string;
}

export interface ChangeSummarySnapshot {
  branch: string | null;
  checkpointId?: string;
  files: ChangeReviewFile[];
  generatedAt: string;
  projectPath: string;
  summary: string;
}

export type ChangeDiffLineKind = "context" | "added" | "removed";

export interface ChangeDiffLine {
  content: string;
  kind: ChangeDiffLineKind;
  lineNumber?: number;
}

export interface ChangeDiffFile {
  additions: number;
  deletions: number;
  language?: string;
  path: string;
  status: GitChangedFile["status"];
  truncated?: boolean;
  lines: ChangeDiffLine[];
}

export interface ChangeReviewDiffSnapshot {
  files: ChangeDiffFile[];
  generatedAt: string;
  projectPath: string;
}

export type OpenChangeDiffErrorCode =
  | "editor-unavailable"
  | "git-unavailable"
  | "invalid-path"
  | "open-failed"
  | "path-not-changed"
  | "project-unavailable"
  | "working-file-unavailable";

export type OpenChangeDiffBeforeSource = "empty" | "git-head";

export type OpenChangeDiffAfterSource = "empty-deleted" | "working-tree";

export type OpenChangeDiffResult =
  | {
      afterSource: OpenChangeDiffAfterSource;
      beforeSource: OpenChangeDiffBeforeSource;
      ok: true;
      openedAt: string;
      path: string;
    }
  | {
      error: {
        code: OpenChangeDiffErrorCode;
        message: string;
      };
      ok: false;
    };

export interface ChangeCheckpointSnapshot {
  baseHead: string;
  branch: string | null;
  createdAt: string;
  id: string;
  projectPath: string;
  runId?: string;
  status: GitStatusSnapshot;
  type: "before-edit" | "before-push" | "manual";
}

export interface CreateChangeCheckpointRequest {
  runId?: string;
  type: ChangeCheckpointSnapshot["type"];
}

export interface ChangeCheckpointResult {
  checkpoint: ChangeCheckpointSnapshot;
  ok: true;
}

export interface RestoreChangeCheckpointRequest {
  checkpointId: string;
}

export interface RestoreChangeCheckpointResult {
  errorMessage?: string;
  restoredFiles: ChangeReviewFile[];
  status: "failed" | "partial" | "restored";
}

export type ChangeRecoveryKind =
  | "checkpoint-missing"
  | "conflict"
  | "revert-failed"
  | "unmergeable";

export interface ChangeRecoveryAction {
  id: string;
  label: string;
}

export interface ChangeRecoveryState {
  actions: ChangeRecoveryAction[];
  detail: string;
  files: ChangeReviewFile[];
  id: string;
  kind: ChangeRecoveryKind;
  summary: string;
  title: string;
}
