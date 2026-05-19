import { createHash } from "node:crypto";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, join } from "node:path";
import { app } from "electron";
import { createAppError, type AppError, type AppErrorCode } from "@shared/errors";
import type {
  ProjectFolderSnapshot,
  ProjectFolderState,
  ProjectFolderValidation,
  ProjectRegistryEntry,
  ProjectRegistryRecovery,
  ProjectRegistryRecoveryStatus,
  ProjectRegistrySnapshot
} from "@shared/project";

const legacyStorageFileName = "project-folder.json";
const registryStorageFileName = "project-registry.json";
const registryVersion = 1;

interface LegacyStoredProjectFolder {
  path: string | null;
}

interface StoredProjectRegistry {
  projects: StoredProjectRegistryEntry[];
  selectedProjectId: string | null;
  version: number;
}

interface StoredProjectRegistryEntry {
  addedAt: string;
  id: string;
  lastSelectedAt: string | null;
  name: string;
  path: string;
  recovery?: ProjectRegistryRecovery;
  updatedAt: string;
}

interface LoadedProjectRegistry {
  error: AppError | null;
  migrated: boolean;
  registry: StoredProjectRegistry;
}

function defaultProjectFolderState(restored = false): ProjectFolderState {
  return {
    projectId: null,
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

function emptyStoredRegistry(): StoredProjectRegistry {
  return {
    projects: [],
    selectedProjectId: null,
    version: registryVersion
  };
}

function legacyStoragePath(): string {
  return join(app.getPath("userData"), legacyStorageFileName);
}

function registryStoragePath(): string {
  return join(app.getPath("userData"), registryStorageFileName);
}

function stateFromValidation(
  validation: ProjectFolderValidation,
  restored: boolean,
  projectId: string | null,
  error: AppError | null = validation.error
): ProjectFolderState {
  return {
    projectId,
    path: validation.path,
    valid: validation.valid,
    restored,
    errorId: error?.id ?? null,
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
    const nodeError = error as NodeJS.ErrnoException;

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
        details: {
          path: trimmedPath,
          error: error instanceof Error ? error.message : String(error),
          errorCode: nodeError.code ?? null
        },
        recoverable: true
      })
    };
  }
}

export async function saveProjectFolder(path: string | null): Promise<AppError | null> {
  const loaded = await loadStoredProjectRegistry();
  const now = new Date().toISOString();
  const registry = loaded.error ? emptyStoredRegistry() : loaded.registry;
  const normalizedPath = path?.trim() || null;

  if (!normalizedPath) {
    registry.selectedProjectId = null;
    return writeStoredProjectRegistry(registry);
  }

  const entry = upsertProjectEntry(registry, normalizedPath, now);
  registry.selectedProjectId = entry.id;

  return writeStoredProjectRegistry(registry);
}

export async function restoreProjectFolder(): Promise<ProjectFolderSnapshot> {
  const loaded = await loadStoredProjectRegistry();

  if (loaded.error && loaded.registry.projects.length === 0) {
    return createProjectFolderSnapshot({
      error: loaded.error,
      registry: loaded.registry,
      restored: true,
      selectedValidation: null
    });
  }

  const { registry, selectedValidation } = await validateStoredProjectRegistry(loaded.registry);

  if (loaded.migrated || registry.projects.length > 0) {
    await writeStoredProjectRegistry(registry).catch(() => null);
  }

  return createProjectFolderSnapshot({
    error: selectedValidation?.error ?? loaded.error,
    registry,
    restored: true,
    selectedValidation
  });
}

export async function selectProjectFolder(path: string): Promise<ProjectFolderSnapshot> {
  const validation = await validateProjectFolder(path);
  const loaded = await loadStoredProjectRegistry();
  const registry = loaded.error ? emptyStoredRegistry() : loaded.registry;
  const now = new Date().toISOString();
  let selectedProjectId = findProjectEntryByPath(registry, validation.path)?.id ?? null;
  let storageError: AppError | null = null;

  if (validation.valid) {
    const entry = upsertProjectEntry(registry, validation.path, now, validation);
    registry.selectedProjectId = entry.id;
    selectedProjectId = entry.id;
    storageError = await writeStoredProjectRegistry(registry);
  }

  const error = validation.error ?? storageError;

  return createProjectFolderSnapshot({
    error,
    registry,
    restored: false,
    selectedValidation: validation,
    selectedProjectIdOverride: selectedProjectId
  });
}

async function loadStoredProjectRegistry(): Promise<LoadedProjectRegistry> {
  try {
    const raw = await readFile(registryStoragePath(), "utf8");

    return {
      error: null,
      migrated: false,
      registry: normalizeStoredProjectRegistry(JSON.parse(raw))
    };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return loadLegacyProjectFolder();
    }

    return {
      error: createAppError({
        code: "FILESYSTEM_READ_FAILED",
        message: "Could not restore the project registry.",
        details: { error: error instanceof Error ? error.message : String(error) },
        recoverable: true
      }),
      migrated: false,
      registry: emptyStoredRegistry()
    };
  }
}

async function loadLegacyProjectFolder(): Promise<LoadedProjectRegistry> {
  try {
    const raw = await readFile(legacyStoragePath(), "utf8");
    const stored = JSON.parse(raw) as LegacyStoredProjectFolder;
    const registry = emptyStoredRegistry();
    const path = typeof stored.path === "string" ? stored.path.trim() : "";

    if (path) {
      const now = new Date().toISOString();
      const entry = upsertProjectEntry(registry, path, now);
      registry.selectedProjectId = entry.id;
    }

    return {
      error: null,
      migrated: true,
      registry
    };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return {
        error: null,
        migrated: false,
        registry: emptyStoredRegistry()
      };
    }

    return {
      error: createAppError({
        code: "FILESYSTEM_READ_FAILED",
        message: "Could not restore the last selected project folder.",
        details: { error: error instanceof Error ? error.message : String(error) },
        recoverable: true
      }),
      migrated: false,
      registry: emptyStoredRegistry()
    };
  }
}

async function writeStoredProjectRegistry(registry: StoredProjectRegistry): Promise<AppError | null> {
  const selectedProjectPath = registry.projects.find((project) => project.id === registry.selectedProjectId)?.path ?? null;

  try {
    await mkdir(app.getPath("userData"), { recursive: true });
    await Promise.all([
      writeFile(registryStoragePath(), JSON.stringify(registry, null, 2), "utf8"),
      writeFile(
        legacyStoragePath(),
        JSON.stringify({ path: selectedProjectPath } satisfies LegacyStoredProjectFolder, null, 2),
        "utf8"
      )
    ]);
    return null;
  } catch (error) {
    return createAppError({
      code: "FILESYSTEM_WRITE_FAILED",
      message: "Could not save the project registry.",
      details: { error: error instanceof Error ? error.message : String(error) },
      recoverable: true
    });
  }
}

async function validateStoredProjectRegistry(
  registry: StoredProjectRegistry
): Promise<{
  registry: StoredProjectRegistry;
  selectedValidation: ProjectFolderValidation | null;
}> {
  const validations = await Promise.all(
    registry.projects.map(async (project) => ({
      project,
      validation: await validateProjectFolder(project.path)
    }))
  );
  const now = new Date().toISOString();
  const projects = validations.map(({ project, validation }) => applyValidationToEntry(project, validation, now));
  const selectedProjectId = projects.some((project) => project.id === registry.selectedProjectId)
    ? registry.selectedProjectId
    : null;
  const selectedValidation = validations.find(({ project }) => project.id === selectedProjectId)?.validation ?? null;

  return {
    registry: {
      projects,
      selectedProjectId,
      version: registryVersion
    },
    selectedValidation
  };
}

function createProjectFolderSnapshot(input: {
  error: AppError | null;
  registry: StoredProjectRegistry;
  restored: boolean;
  selectedProjectIdOverride?: string | null;
  selectedValidation: ProjectFolderValidation | null;
}): ProjectFolderSnapshot {
  const selectedProjectId = input.selectedProjectIdOverride ?? input.registry.selectedProjectId;
  const selectedProject = input.registry.projects.find((project) => project.id === selectedProjectId) ?? null;
  const registry = createProjectRegistrySnapshot(input.registry, input.restored);

  if (!input.selectedValidation) {
    return {
      error: input.error,
      registry,
      state: {
        ...defaultProjectFolderState(input.restored),
        errorId: input.error?.id ?? null
      }
    };
  }

  return {
    error: input.error,
    registry,
    state: stateFromValidation(
      input.selectedValidation,
      input.restored,
      selectedProject?.id ?? selectedProjectId ?? null,
      input.error ?? input.selectedValidation.error
    )
  };
}

function createProjectRegistrySnapshot(
  registry: StoredProjectRegistry,
  restored: boolean
): ProjectRegistrySnapshot {
  const projects = registry.projects
    .map((project): ProjectRegistryEntry => ({
      addedAt: project.addedAt,
      id: project.id,
      lastSelectedAt: project.lastSelectedAt,
      name: project.name,
      path: project.path,
      recovery: project.recovery ?? uncheckedRecovery(),
      updatedAt: project.updatedAt
    }))
    .sort(compareProjectEntries);
  const selectedProject = projects.find((project) => project.id === registry.selectedProjectId) ?? null;

  return {
    projects,
    restored,
    selectedProjectId: selectedProject?.id ?? null,
    selectedProjectPath: selectedProject?.path ?? null
  };
}

function normalizeStoredProjectRegistry(input: unknown): StoredProjectRegistry {
  if (!isRecord(input)) {
    throw new Error("Project registry storage is malformed.");
  }

  const registry = emptyStoredRegistry();
  const projects = Array.isArray(input.projects) ? input.projects : [];

  for (const item of projects) {
    if (!isRecord(item) || typeof item.path !== "string" || !item.path.trim()) {
      continue;
    }

    const path = item.path.trim();
    const id = typeof item.id === "string" && item.id.trim() ? item.id : projectIdForPath(path);
    const addedAt = getStoredTimestamp(item.addedAt);
    const updatedAt = getStoredTimestamp(item.updatedAt);
    const lastSelectedAt = getStoredTimestamp(item.lastSelectedAt);

    registry.projects.push({
      addedAt,
      id,
      lastSelectedAt,
      name: typeof item.name === "string" && item.name.trim() ? item.name : projectNameForPath(path),
      path,
      recovery: normalizeStoredRecovery(item.recovery),
      updatedAt
    });
  }

  registry.selectedProjectId =
    typeof input.selectedProjectId === "string" &&
    registry.projects.some((project) => project.id === input.selectedProjectId)
      ? input.selectedProjectId
      : null;

  return dedupeStoredRegistry(registry);
}

function dedupeStoredRegistry(registry: StoredProjectRegistry): StoredProjectRegistry {
  const projectsById = new Map<string, StoredProjectRegistryEntry>();

  for (const project of registry.projects) {
    const existing = projectsById.get(project.id);

    if (!existing || compareProjectEntries(project, existing) < 0) {
      projectsById.set(project.id, project);
    }
  }

  const projects = [...projectsById.values()];

  return {
    projects,
    selectedProjectId: projects.some((project) => project.id === registry.selectedProjectId)
      ? registry.selectedProjectId
      : null,
    version: registryVersion
  };
}

function upsertProjectEntry(
  registry: StoredProjectRegistry,
  path: string,
  timestamp: string,
  validation?: ProjectFolderValidation
): StoredProjectRegistryEntry {
  const normalizedPath = path.trim();
  const id = projectIdForPath(normalizedPath);
  const existing = registry.projects.find((project) => project.id === id);
  const entry: StoredProjectRegistryEntry = {
    addedAt: existing?.addedAt ?? timestamp,
    id,
    lastSelectedAt: timestamp,
    name: projectNameForPath(normalizedPath),
    path: normalizedPath,
    recovery: validation ? recoveryFromValidation(validation, timestamp) : existing?.recovery ?? uncheckedRecovery(),
    updatedAt: timestamp
  };

  if (existing) {
    Object.assign(existing, entry);
    return existing;
  }

  registry.projects.push(entry);
  return entry;
}

function applyValidationToEntry(
  entry: StoredProjectRegistryEntry,
  validation: ProjectFolderValidation,
  timestamp: string
): StoredProjectRegistryEntry {
  return {
    ...entry,
    name: projectNameForPath(validation.path),
    path: validation.path,
    recovery: recoveryFromValidation(validation, timestamp),
    updatedAt: timestamp
  };
}

function findProjectEntryByPath(
  registry: StoredProjectRegistry,
  path: string
): StoredProjectRegistryEntry | undefined {
  const id = projectIdForPath(path.trim());

  return registry.projects.find((project) => project.id === id);
}

function recoveryFromValidation(
  validation: ProjectFolderValidation,
  checkedAt: string
): ProjectRegistryRecovery {
  return {
    canRead: validation.canRead,
    canWrite: validation.canWrite,
    checkedAt,
    errorCode: validation.error?.code ?? null,
    errorId: validation.error?.id ?? null,
    isDirectory: validation.isDirectory,
    isGitRepository: validation.isGitRepository,
    message: validation.error?.message ?? null,
    status: recoveryStatusFromValidation(validation)
  };
}

function recoveryStatusFromValidation(
  validation: ProjectFolderValidation
): ProjectRegistryRecoveryStatus {
  if (validation.valid) {
    return "available";
  }

  if (validation.error?.code === "PROJECT_FOLDER_UNAVAILABLE") {
    return isMissingProjectValidation(validation) ? "missing" : "unavailable";
  }

  return "invalid";
}

function isMissingProjectValidation(validation: ProjectFolderValidation): boolean {
  if (!isRecord(validation.error?.details)) {
    return false;
  }

  const errorCode = validation.error.details.errorCode;

  return errorCode === "ENOENT" || errorCode === "ENOTDIR";
}

function normalizeStoredRecovery(input: unknown): ProjectRegistryRecovery {
  if (!isRecord(input)) {
    return uncheckedRecovery();
  }

  const status = isRecoveryStatus(input.status) ? input.status : "unchecked";

  return {
    canRead: input.canRead === true,
    canWrite: input.canWrite === true,
    checkedAt: typeof input.checkedAt === "string" ? input.checkedAt : null,
    errorCode: isAppErrorCode(input.errorCode) ? input.errorCode : null,
    errorId: typeof input.errorId === "string" ? input.errorId : null,
    isDirectory: input.isDirectory === true,
    isGitRepository: input.isGitRepository === true,
    message: typeof input.message === "string" ? input.message : null,
    status
  };
}

function uncheckedRecovery(): ProjectRegistryRecovery {
  return {
    canRead: false,
    canWrite: false,
    checkedAt: null,
    errorCode: null,
    errorId: null,
    isDirectory: false,
    isGitRepository: false,
    message: null,
    status: "unchecked"
  };
}

function isRecoveryStatus(value: unknown): value is ProjectRegistryRecoveryStatus {
  return (
    value === "available" ||
    value === "invalid" ||
    value === "missing" ||
    value === "unchecked" ||
    value === "unavailable"
  );
}

function isAppErrorCode(value: unknown): value is AppErrorCode {
  return (
    value === "UNKNOWN" ||
    value === "IPC_UNAVAILABLE" ||
    value === "FILESYSTEM_READ_FAILED" ||
    value === "FILESYSTEM_WRITE_FAILED" ||
    value === "AGENT_SESSION_CREATE_FAILED" ||
    value === "AGENT_SESSION_ABORT_FAILED" ||
    value === "AGENT_SESSION_DISPOSE_FAILED" ||
    value === "AGENT_SESSION_PROMPT_FAILED" ||
    value === "PI_RUNTIME_START_FAILED" ||
    value === "PI_RUNTIME_UNAVAILABLE" ||
    value === "PROJECT_FOLDER_INVALID" ||
    value === "PROJECT_FOLDER_UNAVAILABLE" ||
    value === "SESSION_BUSY" ||
    value === "SESSION_UNAVAILABLE" ||
    value === "SDK_UNAVAILABLE"
  );
}

function projectIdForPath(path: string): string {
  return `project-${createHash("sha256").update(path).digest("hex").slice(0, 16)}`;
}

function projectNameForPath(path: string): string {
  return basename(path) || path;
}

function getStoredTimestamp(value: unknown): string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime())
    ? value
    : new Date().toISOString();
}

function compareProjectEntries(
  left: Pick<ProjectRegistryEntry, "lastSelectedAt" | "updatedAt" | "name">,
  right: Pick<ProjectRegistryEntry, "lastSelectedAt" | "updatedAt" | "name">
): number {
  const leftTimestamp = new Date(left.lastSelectedAt ?? left.updatedAt).getTime();
  const rightTimestamp = new Date(right.lastSelectedAt ?? right.updatedAt).getTime();

  if (rightTimestamp !== leftTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  return left.name.localeCompare(right.name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
