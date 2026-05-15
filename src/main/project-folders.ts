import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import { createAppError, type AppError } from "@shared/errors";
import type { ProjectFolderSnapshot, ProjectFolderState, ProjectFolderValidation } from "@shared/project";

const storageFileName = "project-folder.json";

interface StoredProjectFolder {
  path: string | null;
}

function defaultProjectFolderState(restored = false): ProjectFolderState {
  return {
    path: null,
    valid: false,
    restored,
    errorId: null,
    checking: false,
    isGitRepository: false,
    canRead: false,
    canWrite: false
  };
}

function storagePath(): string {
  return join(app.getPath("userData"), storageFileName);
}

function stateFromValidation(validation: ProjectFolderValidation, restored: boolean): ProjectFolderState {
  return {
    path: validation.path,
    valid: validation.valid,
    restored,
    errorId: validation.error?.id ?? null,
    checking: false,
    isGitRepository: validation.isGitRepository,
    canRead: validation.canRead,
    canWrite: validation.canWrite
  };
}

async function pathHasAccess(path: string, mode: number): Promise<boolean> {
  try {
    await access(path, mode);
    return true;
  } catch {
    return false;
  }
}

export async function validateProjectFolder(path: string): Promise<ProjectFolderValidation> {
  const trimmedPath = path.trim();

  if (!trimmedPath) {
    return {
      path,
      valid: false,
      isDirectory: false,
      canRead: false,
      canWrite: false,
      isGitRepository: false,
      error: createAppError({
        code: "PROJECT_FOLDER_INVALID",
        message: "Project folder path is empty.",
        recoverable: true
      })
    };
  }

  try {
    const folderStats = await stat(trimmedPath);
    const isDirectory = folderStats.isDirectory();
    const canRead = isDirectory ? await pathHasAccess(trimmedPath, constants.R_OK) : false;
    const canWrite = isDirectory ? await pathHasAccess(trimmedPath, constants.W_OK) : false;
    const gitStats = isDirectory
      ? await stat(join(trimmedPath, ".git")).catch(() => null)
      : null;
    const isGitRepository = Boolean(gitStats);
    const valid = isDirectory && canRead;

    return {
      path: trimmedPath,
      valid,
      isDirectory,
      canRead,
      canWrite,
      isGitRepository,
      error: valid
        ? null
        : createAppError({
            code: "PROJECT_FOLDER_INVALID",
            message: "Selected path is not a readable project folder.",
            details: { path: trimmedPath, isDirectory, canRead, canWrite },
            recoverable: true
          })
    };
  } catch (error) {
    return {
      path: trimmedPath,
      valid: false,
      isDirectory: false,
      canRead: false,
      canWrite: false,
      isGitRepository: false,
      error: createAppError({
        code: "PROJECT_FOLDER_UNAVAILABLE",
        message: "Project folder is missing or unavailable.",
        details: { path: trimmedPath, error: error instanceof Error ? error.message : String(error) },
        recoverable: true
      })
    };
  }
}

export async function saveProjectFolder(path: string | null): Promise<AppError | null> {
  try {
    await mkdir(app.getPath("userData"), { recursive: true });
    await writeFile(storagePath(), JSON.stringify({ path } satisfies StoredProjectFolder, null, 2), "utf8");
    return null;
  } catch (error) {
    return createAppError({
      code: "FILESYSTEM_WRITE_FAILED",
      message: "Could not save the selected project folder.",
      details: { error: error instanceof Error ? error.message : String(error) },
      recoverable: true
    });
  }
}

export async function restoreProjectFolder(): Promise<ProjectFolderSnapshot> {
  try {
    const raw = await readFile(storagePath(), "utf8");
    const stored = JSON.parse(raw) as StoredProjectFolder;

    if (!stored.path) {
      return { state: defaultProjectFolderState(true), error: null };
    }

    const validation = await validateProjectFolder(stored.path);
    return {
      state: stateFromValidation(validation, true),
      error: validation.error
    };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return { state: defaultProjectFolderState(true), error: null };
    }

    const appError = createAppError({
      code: "FILESYSTEM_READ_FAILED",
      message: "Could not restore the last selected project folder.",
      details: { error: error instanceof Error ? error.message : String(error) },
      recoverable: true
    });

    return {
      state: { ...defaultProjectFolderState(true), errorId: appError.id },
      error: appError
    };
  }
}

export async function selectProjectFolder(path: string): Promise<ProjectFolderSnapshot> {
  const validation = await validateProjectFolder(path);
  const storageError = validation.valid ? await saveProjectFolder(validation.path) : null;
  const error = validation.error ?? storageError;

  return {
    state: {
      ...stateFromValidation(validation, false),
      errorId: error?.id ?? null
    },
    error
  };
}
