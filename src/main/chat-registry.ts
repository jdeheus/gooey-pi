import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { app } from "electron";
import type {
  ChatRegistryChat,
  ChatRegistryCreateRequest,
  ChatRegistryDeleteRequest,
  ChatRegistryMutationResult,
  ChatRegistryProject,
  ChatRegistryRenameRequest,
  ChatRegistryRestoreResult,
  ChatRegistrySelectRequest,
  ChatRegistrySnapshot
} from "@shared/chat-registry";
import { createAppError, type AppError } from "@shared/errors";

const storageFileName = "chat-registry.json";
const registryVersion = 1;

interface StoredChatRegistry {
  projects: ChatRegistryProject[];
  updatedAt: string | null;
  version: typeof registryVersion;
}

function storagePath(): string {
  return join(app.getPath("userData"), storageFileName);
}

function defaultRegistry(): StoredChatRegistry {
  return {
    projects: [],
    updatedAt: null,
    version: registryVersion
  };
}

function toSnapshot(registry: StoredChatRegistry): ChatRegistrySnapshot {
  return {
    projects: registry.projects.map((project) => ({
      ...project,
      chats: project.chats.map((chat) => ({ ...chat }))
    })),
    updatedAt: registry.updatedAt
  };
}

function getProjectName(projectPath: string): string {
  return projectPath.split(/[\\/]/).filter(Boolean).at(-1) ?? projectPath;
}

function createRegistryError(message: string, details?: unknown): AppError {
  return createAppError({
    code: "UNKNOWN",
    message,
    details,
    recoverable: true
  });
}

async function readRegistry(): Promise<StoredChatRegistry> {
  try {
    const raw = await readFile(storagePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredChatRegistry>;

    return normalizeRegistry(parsed);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return defaultRegistry();
    }

    throw createAppError({
      code: "FILESYSTEM_READ_FAILED",
      message: "Could not restore the chat registry.",
      details: { error: error instanceof Error ? error.message : String(error) },
      recoverable: true
    });
  }
}

function normalizeRegistry(parsed: Partial<StoredChatRegistry>): StoredChatRegistry {
  const projects = Array.isArray(parsed.projects) ? parsed.projects : [];

  return {
    projects: projects.flatMap((project) => {
      if (!project || typeof project.path !== "string" || !project.path.trim()) {
        return [];
      }

      const projectPath = project.path.trim();
      const chats = Array.isArray(project.chats) ? project.chats : [];
      const normalizedChats = chats.flatMap((chat) => {
        if (!chat || typeof chat.id !== "string" || !chat.id.trim()) {
          return [];
        }

        const createdAt = typeof chat.createdAt === "string" ? chat.createdAt : new Date().toISOString();
        const updatedAt = typeof chat.updatedAt === "string" ? chat.updatedAt : createdAt;

        return {
          createdAt,
          hiddenAt: typeof chat.hiddenAt === "string" ? chat.hiddenAt : null,
          id: chat.id.trim(),
          projectPath,
          sessionFile: typeof chat.sessionFile === "string" ? chat.sessionFile : null,
          sessionId: typeof chat.sessionId === "string" ? chat.sessionId : null,
          title: typeof chat.title === "string" && chat.title.trim() ? chat.title.trim() : "Untitled chat",
          updatedAt
        } satisfies ChatRegistryChat;
      });

      const activeChatId =
        typeof project.activeChatId === "string" &&
        normalizedChats.some((chat) => chat.id === project.activeChatId)
          ? project.activeChatId
          : null;

      return {
        activeChatId,
        chats: normalizedChats,
        name: typeof project.name === "string" && project.name.trim()
          ? project.name.trim()
          : getProjectName(projectPath),
        path: projectPath,
        updatedAt: typeof project.updatedAt === "string"
          ? project.updatedAt
          : normalizedChats.at(-1)?.updatedAt ?? new Date().toISOString()
      } satisfies ChatRegistryProject;
    }),
    updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
    version: registryVersion
  };
}

async function writeRegistry(registry: StoredChatRegistry): Promise<AppError | null> {
  try {
    await mkdir(app.getPath("userData"), { recursive: true });
    await writeFile(storagePath(), JSON.stringify(registry, null, 2), "utf8");
    return null;
  } catch (error) {
    return createAppError({
      code: "FILESYSTEM_WRITE_FAILED",
      message: "Could not save the chat registry.",
      details: { error: error instanceof Error ? error.message : String(error) },
      recoverable: true
    });
  }
}

function findProject(registry: StoredChatRegistry, projectPath: string): ChatRegistryProject | undefined {
  return registry.projects.find((project) => project.path === projectPath);
}

function ensureProject(registry: StoredChatRegistry, projectPath: string, timestamp: string): ChatRegistryProject {
  const existing = findProject(registry, projectPath);

  if (existing) {
    return existing;
  }

  const project: ChatRegistryProject = {
    activeChatId: null,
    chats: [],
    name: getProjectName(projectPath),
    path: projectPath,
    updatedAt: timestamp
  };

  registry.projects.push(project);
  return project;
}

function createMutationResult(
  registry: StoredChatRegistry,
  chat: ChatRegistryChat | null,
  error: AppError | null
): ChatRegistryMutationResult {
  return {
    chat,
    error,
    snapshot: toSnapshot(registry)
  };
}

export async function getChatRegistry(): Promise<ChatRegistrySnapshot> {
  return toSnapshot(await readRegistry());
}

export async function createChatRegistryChat(
  request: ChatRegistryCreateRequest
): Promise<ChatRegistryMutationResult> {
  const registry = await readRegistry();
  const projectPath = request.projectPath.trim();

  if (!projectPath) {
    return createMutationResult(
      registry,
      null,
      createRegistryError("A project path is required before creating a chat.")
    );
  }

  const timestamp = new Date().toISOString();
  const project = ensureProject(registry, projectPath, timestamp);
  const chat: ChatRegistryChat = {
    createdAt: timestamp,
    hiddenAt: null,
    id: `chat-${randomUUID()}`,
    projectPath,
    sessionFile: request.sessionFile ?? null,
    sessionId: request.sessionId ?? null,
    title: request.title?.trim() || "New chat",
    updatedAt: timestamp
  };

  project.chats = [chat, ...project.chats];
  project.activeChatId = chat.id;
  project.updatedAt = timestamp;
  registry.updatedAt = timestamp;

  const writeError = await writeRegistry(registry);
  return createMutationResult(registry, chat, writeError);
}

export async function renameChatRegistryChat(
  request: ChatRegistryRenameRequest
): Promise<ChatRegistryMutationResult> {
  const registry = await readRegistry();
  const title = request.title.trim();

  if (!title) {
    return createMutationResult(
      registry,
      null,
      createRegistryError("A chat title is required before renaming a chat.")
    );
  }

  const timestamp = new Date().toISOString();
  const project = registry.projects.find((candidate) =>
    candidate.chats.some((chat) => chat.id === request.chatId)
  );
  const chat = project?.chats.find((candidate) => candidate.id === request.chatId) ?? null;

  if (!project || !chat) {
    return createMutationResult(
      registry,
      null,
      createRegistryError("The chat to rename could not be found.", { chatId: request.chatId })
    );
  }

  chat.title = title;
  chat.updatedAt = timestamp;
  project.updatedAt = timestamp;
  registry.updatedAt = timestamp;

  const writeError = await writeRegistry(registry);
  return createMutationResult(registry, chat, writeError);
}

export async function selectChatRegistryChat(
  request: ChatRegistrySelectRequest
): Promise<ChatRegistryMutationResult> {
  const registry = await readRegistry();
  const projectPath = request.projectPath.trim();

  if (!projectPath) {
    return createMutationResult(
      registry,
      null,
      createRegistryError("A project path is required before selecting a chat.")
    );
  }

  const timestamp = new Date().toISOString();
  const project = ensureProject(registry, projectPath, timestamp);

  if (request.chatId === null) {
    project.activeChatId = null;
    project.updatedAt = timestamp;
    registry.updatedAt = timestamp;
    const writeError = await writeRegistry(registry);
    return createMutationResult(registry, null, writeError);
  }

  const chat = project.chats.find((candidate) => candidate.id === request.chatId) ?? null;

  if (!chat || chat.hiddenAt) {
    project.activeChatId = null;
    project.updatedAt = timestamp;
    registry.updatedAt = timestamp;
    const writeError = await writeRegistry(registry);
    return createMutationResult(
      registry,
      null,
      writeError ??
        createRegistryError("The selected chat is no longer available.", {
          chatId: request.chatId,
          projectPath
        })
    );
  }

  project.activeChatId = chat.id;
  project.updatedAt = timestamp;
  registry.updatedAt = timestamp;

  const writeError = await writeRegistry(registry);
  return createMutationResult(registry, chat, writeError);
}

export async function deleteChatRegistryChat(
  request: ChatRegistryDeleteRequest
): Promise<ChatRegistryMutationResult> {
  const registry = await readRegistry();
  const timestamp = new Date().toISOString();
  const project = registry.projects.find((candidate) =>
    request.projectPath
      ? candidate.path === request.projectPath
      : candidate.chats.some((chat) => chat.id === request.chatId)
  );
  const chat = project?.chats.find((candidate) => candidate.id === request.chatId) ?? null;

  if (!project || !chat) {
    return createMutationResult(
      registry,
      null,
      createRegistryError("The chat to hide or delete could not be found.", {
        chatId: request.chatId,
        projectPath: request.projectPath
      })
    );
  }

  if (request.mode === "delete") {
    project.chats = project.chats.filter((candidate) => candidate.id !== request.chatId);
  } else {
    chat.hiddenAt = timestamp;
    chat.updatedAt = timestamp;
  }

  if (project.activeChatId === request.chatId) {
    project.activeChatId = null;
  }

  project.updatedAt = timestamp;
  registry.updatedAt = timestamp;

  const writeError = await writeRegistry(registry);
  return createMutationResult(registry, chat, writeError);
}

export async function restoreActiveChat(projectPath: string | null): Promise<ChatRegistryRestoreResult> {
  const registry = await readRegistry();

  if (!projectPath?.trim()) {
    return {
      activeChatId: null,
      chat: null,
      error: null,
      fallbackReason: "no-project",
      projectPath: null,
      recoveryNotice: null,
      snapshot: toSnapshot(registry),
      transcript: null
    };
  }

  const normalizedProjectPath = projectPath.trim();
  const project = findProject(registry, normalizedProjectPath);

  if (!project?.activeChatId) {
    return {
      activeChatId: null,
      chat: null,
      error: null,
      fallbackReason: "no-selected-chat",
      projectPath: normalizedProjectPath,
      recoveryNotice: null,
      snapshot: toSnapshot(registry),
      transcript: null
    };
  }

  const selectedChatId = project.activeChatId;
  const chat = project.chats.find((candidate) => candidate.id === selectedChatId) ?? null;
  const fallbackReason = chat?.hiddenAt ? "hidden-selected-chat" : chat ? null : "missing-selected-chat";

  if (!fallbackReason) {
    return {
      activeChatId: selectedChatId,
      chat,
      error: null,
      fallbackReason: null,
      projectPath: normalizedProjectPath,
      recoveryNotice: null,
      snapshot: toSnapshot(registry),
      transcript: null
    };
  }

  const timestamp = new Date().toISOString();
  project.activeChatId = null;
  project.updatedAt = timestamp;
  registry.updatedAt = timestamp;
  const writeError = await writeRegistry(registry);

  return {
    activeChatId: null,
    chat: null,
    error: writeError,
    fallbackReason,
    projectPath: normalizedProjectPath,
    recoveryNotice: "The last selected chat is no longer available. Start a new chat for this project.",
    snapshot: toSnapshot(registry),
    transcript: null
  };
}
