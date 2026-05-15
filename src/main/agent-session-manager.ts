import type { AgentSession, AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import { createAppError, type AppError } from "@shared/errors";
import type { CreateAgentSessionResult } from "@shared/pi";
import type { SessionSnapshot } from "@shared/session";
import { validateProjectFolder } from "./project-folders";
import { ensurePiRuntimeReady, getPiRuntimeState, getPiSdk } from "./pi-runtime";

function idleSession(): SessionSnapshot {
  return {
    id: null,
    status: "idle",
    projectPath: null,
    sessionFile: null,
    errorId: null
  };
}

function errorSession(projectPath: string | null, error: AppError): SessionSnapshot {
  return {
    id: null,
    status: "errored",
    projectPath,
    sessionFile: null,
    errorId: error.id
  };
}

export class AgentSessionManager {
  private activeSession: AgentSession | null = null;
  private unsubscribe: (() => void) | null = null;
  private snapshot: SessionSnapshot = idleSession();

  getSnapshot(): SessionSnapshot {
    return this.snapshot;
  }

  async create(projectPath: string): Promise<CreateAgentSessionResult> {
    const validation = await validateProjectFolder(projectPath);

    if (!validation.valid) {
      const error =
        validation.error ??
        createAppError({
          code: "PROJECT_FOLDER_INVALID",
          message: "A valid project folder is required before creating an AgentSession.",
          recoverable: true
        });

      this.snapshot = errorSession(validation.path || projectPath, error);
      return { session: this.snapshot, runtime: getPiRuntimeState(), error };
    }

    const runtime = await ensurePiRuntimeReady();

    if (runtime.status !== "ready") {
      const error =
        runtime.error ??
        createAppError({
          code: "PI_RUNTIME_UNAVAILABLE",
          message: "Pi runtime is not ready.",
          recoverable: true
        });

      this.snapshot = errorSession(validation.path, error);
      return { session: this.snapshot, runtime, error };
    }

    try {
      await this.dispose();

      const sdk = await getPiSdk();
      const authStorage = sdk.AuthStorage.create();
      const modelRegistry = sdk.ModelRegistry.create(authStorage);
      const { session } = await sdk.createAgentSession({
        cwd: validation.path,
        authStorage,
        modelRegistry,
        sessionManager: sdk.SessionManager.create(validation.path)
      });

      this.activeSession = session;
      this.unsubscribe = session.subscribe((event) => this.handleSessionEvent(event));
      this.snapshot = {
        id: session.sessionId,
        status: "ready",
        projectPath: validation.path,
        sessionFile: session.sessionFile ?? null,
        errorId: null
      };

      return { session: this.snapshot, runtime: getPiRuntimeState(), error: null };
    } catch (error) {
      const appError = createAppError({
        code: "AGENT_SESSION_CREATE_FAILED",
        message: "Could not create a Pi AgentSession.",
        details: error instanceof Error ? error.message : String(error),
        recoverable: true
      });

      this.snapshot = errorSession(validation.path, appError);
      return { session: this.snapshot, runtime: getPiRuntimeState(), error: appError };
    }
  }

  async dispose(): Promise<AppError | null> {
    const session = this.activeSession;

    this.unsubscribe?.();
    this.unsubscribe = null;
    this.activeSession = null;

    if (!session) {
      return null;
    }

    try {
      session.dispose();
      this.snapshot = {
        ...this.snapshot,
        status: "disposed"
      };
      return null;
    } catch (error) {
      const appError = createAppError({
        code: "AGENT_SESSION_DISPOSE_FAILED",
        message: "Could not dispose the active Pi AgentSession.",
        details: error instanceof Error ? error.message : String(error),
        recoverable: true
      });

      this.snapshot = {
        ...this.snapshot,
        status: "errored",
        errorId: appError.id
      };

      return appError;
    }
  }

  private handleSessionEvent(_event: AgentSessionEvent): void {
    if (!this.activeSession) {
      return;
    }

    this.snapshot = {
      ...this.snapshot,
      status: this.activeSession.isStreaming ? "running" : "ready"
    };
  }
}

export const agentSessionManager = new AgentSessionManager();
