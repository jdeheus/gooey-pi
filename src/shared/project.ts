import type { AppError, AppErrorCode } from "./errors";

export type ProjectRegistryRecoveryStatus =
  | "available"
  | "invalid"
  | "missing"
  | "unchecked"
  | "unavailable";

export interface ProjectRegistryRecovery {
  canRead: boolean;
  canWrite: boolean;
  checkedAt: string | null;
  errorCode: AppErrorCode | null;
  errorId: string | null;
  isDirectory: boolean;
  isGitRepository: boolean;
  message: string | null;
  status: ProjectRegistryRecoveryStatus;
}

export interface ProjectRegistryEntry {
  addedAt: string;
  id: string;
  lastSelectedAt: string | null;
  name: string;
  path: string;
  recovery: ProjectRegistryRecovery;
  updatedAt: string;
}

export interface ProjectRegistrySnapshot {
  projects: ProjectRegistryEntry[];
  restored: boolean;
  selectedProjectId: string | null;
  selectedProjectPath: string | null;
}

export interface ProjectFolderState {
  projectId: string | null;
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
  registry: ProjectRegistrySnapshot;
  state: ProjectFolderState;
  error: AppError | null;
}

export interface SelectProjectFolderResult extends ProjectFolderSnapshot {
  canceled: boolean;
}
