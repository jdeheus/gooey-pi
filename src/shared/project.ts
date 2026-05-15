import type { AppError } from "./errors";

export interface ProjectFolderState {
  path: string | null;
  valid: boolean;
  restored: boolean;
  errorId: string | null;
  checking: boolean;
  isGitRepository: boolean;
  canRead: boolean;
  canWrite: boolean;
}

export interface ProjectFolderValidation {
  path: string;
  valid: boolean;
  isDirectory: boolean;
  canRead: boolean;
  canWrite: boolean;
  isGitRepository: boolean;
  error: AppError | null;
}

export interface ProjectFolderSnapshot {
  state: ProjectFolderState;
  error: AppError | null;
}

export interface SelectProjectFolderResult extends ProjectFolderSnapshot {
  canceled: boolean;
}
