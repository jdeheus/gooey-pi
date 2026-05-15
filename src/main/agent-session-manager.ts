import type { AgentSession, AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import { createAppError, type AppError } from "@shared/errors";
import type { CreateAgentSessionResult, SendPromptResult } from "@shared/pi";
import type { SessionSnapshot } from "@shared/session";
import { eventStream } from "./event-stream";
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
      eventStream.recordError(error);
      eventStream.recordSessionSnapshot(this.snapshot);
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
      eventStream.recordError(error);
      eventStream.recordSessionSnapshot(this.snapshot);
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
      eventStream.recordSessionStatus(this.snapshot.status);
      eventStream.recordSessionSnapshot(this.snapshot);

      return { session: this.snapshot, runtime: getPiRuntimeState(), error: null };
    } catch (error) {
      const appError = createAppError({
        code: "AGENT_SESSION_CREATE_FAILED",
        message: "Could not create a Pi AgentSession.",
        details: error instanceof Error ? error.message : String(error),
        recoverable: true
      });

      this.snapshot = errorSession(validation.path, appError);
      eventStream.recordError(appError);
      eventStream.recordSessionSnapshot(this.snapshot);
      return { session: this.snapshot, runtime: getPiRuntimeState(), error: appError };
    }
  }

  sendPrompt(text: string): SendPromptResult {
    const content = text.trim();

    if (!content) {
      const error = createAppError({
        code: "AGENT_SESSION_PROMPT_FAILED",
        message: "Prompt text is required before sending.",
        recoverable: true
      });

      eventStream.recordError(error);
      return { session: this.snapshot, messageId: null, error };
    }

    const session = this.activeSession;

    if (!session || !this.snapshot.id) {
      const error = createAppError({
        code: "SESSION_UNAVAILABLE",
        message: "Create an AgentSession before sending a prompt.",
        recoverable: true
      });

      this.snapshot = {
        ...this.snapshot,
        status: "errored",
        errorId: error.id
      };
      eventStream.recordError(error);
      eventStream.recordSessionSnapshot(this.snapshot);
      return { session: this.snapshot, messageId: null, error };
    }

    if (session.isStreaming || this.snapshot.status === "running") {
      const error = createAppError({
        code: "SESSION_BUSY",
        message: "Wait for the active run to finish before sending another prompt.",
        recoverable: true
      });

      eventStream.recordError(error);
      return { session: this.snapshot, messageId: null, error };
    }

    const messageId = eventStream.recordUserMessage(content);
    this.snapshot = {
      ...this.snapshot,
      status: "running",
      errorId: null
    };
    eventStream.recordSessionStatus(this.snapshot.status);
    eventStream.recordSessionSnapshot(this.snapshot);

    void session
      .prompt(content)
      .then(() => {
        if (this.activeSession === session) {
          this.snapshot = {
            ...this.snapshot,
            status: "ready",
            errorId: null
          };
          eventStream.recordSessionStatus(this.snapshot.status);
          eventStream.recordSessionSnapshot(this.snapshot);
        }
      })
      .catch((error) => {
        const appError = createAppError({
          code: "AGENT_SESSION_PROMPT_FAILED",
          message: "Prompt submission failed.",
          details: error instanceof Error ? error.message : String(error),
          recoverable: true
        });

        if (this.activeSession === session) {
          this.snapshot = {
            ...this.snapshot,
            status: "errored",
            errorId: appError.id
          };
        }

        eventStream.recordError(appError);
        eventStream.recordSessionSnapshot(this.snapshot);
      });

    return { session: this.snapshot, messageId, error: null };
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
      eventStream.recordSessionStatus(this.snapshot.status);
      eventStream.recordSessionSnapshot(this.snapshot);
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
      eventStream.recordError(appError);
      eventStream.recordSessionSnapshot(this.snapshot);

      return appError;
    }
  }

  private handleSessionEvent(event: AgentSessionEvent): void {
    if (!this.activeSession) {
      return;
    }

    try {
      eventStream.captureRawPiEvent(this.activeSession.sessionId, event);
    } catch (error) {
      eventStream.recordUnknownCaptureError(error);
    } finally {
      this.snapshot = {
        ...this.snapshot,
        status: this.activeSession.isStreaming ? "running" : "ready"
      };
      eventStream.recordSessionSnapshot(this.snapshot);
    }
  }
}

export const agentSessionManager = new AgentSessionManager();
