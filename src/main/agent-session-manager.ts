import type { AgentSession, AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import { createAppError, type AppError } from "@shared/errors";
import type {
  AgentSessionSubmitRequest,
  AgentSessionSubmitResult,
  CreateAgentSessionResult,
  DisposeAgentSessionResult,
  StopAgentSessionResult
} from "@shared/pi";
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
  private abortPromise: Promise<StopAgentSessionResult> | null = null;
  private runSequence = 0;
  private activeRunId: number | null = null;
  private queuedSubmissions: AgentSessionSubmitRequest[] = [];

  getSnapshot(): SessionSnapshot {
    return this.snapshot;
  }

  async create(projectPath: string): Promise<CreateAgentSessionResult> {
    if (this.isActiveRun()) {
      const error = createAppError({
        code: "SESSION_BUSY",
        message: "Stop the active run before creating a new AgentSession.",
        recoverable: true
      });

      eventStream.recordError(error);
      return { session: this.snapshot, runtime: getPiRuntimeState(), error };
    }

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
      const disposeError = await this.dispose();

      if (disposeError) {
        return { session: this.snapshot, runtime: getPiRuntimeState(), error: disposeError };
      }

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

  submitPrompt(request: AgentSessionSubmitRequest): AgentSessionSubmitResult {
    const content = formatSubmitRequestForPi(request);

    if (!hasSubmitContent(request)) {
      const error = createAppError({
        code: "AGENT_SESSION_PROMPT_FAILED",
        message: "Add a message, attachment, or selected context before sending.",
        recoverable: true
      });

      eventStream.recordError(error);
      return {
        session: this.snapshot,
        messageId: null,
        runId: null,
        status: "rejected",
        error
      };
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
      return {
        session: this.snapshot,
        messageId: null,
        runId: null,
        status: "failed",
        error
      };
    }

    if (this.isActiveRun()) {
      if (request.intent === "queue" || request.intent === "steer") {
        const messageId = eventStream.recordUserMessage(formatSubmitRequestForTranscript(request));
        this.queuedSubmissions.push(request);
        return {
          session: this.snapshot,
          messageId,
          runId: null,
          status: request.intent === "steer" ? "steered" : "queued",
          error: null
        };
      }

      const error = createAppError({
        code: "SESSION_BUSY",
        message: "Wait for the active run to finish, or queue the message.",
        recoverable: true
      });

      eventStream.recordError(error);
      return {
        session: this.snapshot,
        messageId: null,
        runId: null,
        status: "rejected",
        error
      };
    }

    const messageId = eventStream.recordUserMessage(formatSubmitRequestForTranscript(request));
    const runId = this.startPromptRun(session, request);

    return {
      session: this.snapshot,
      messageId,
      runId: String(runId),
      status: request.intent === "steer" ? "steered" : "accepted",
      error: null
    };
  }

  private startPromptRun(
    session: AgentSession,
    request: AgentSessionSubmitRequest
  ): number {
    const runId = ++this.runSequence;
    this.activeRunId = runId;
    this.snapshot = {
      ...this.snapshot,
      status: "running",
      errorId: null
    };
    eventStream.recordSessionStatus(this.snapshot.status);
    eventStream.recordSessionSnapshot(this.snapshot);

    void session
      .prompt(formatSubmitRequestForPi(request))
      .then(() => {
        if (this.activeSession === session && this.activeRunId === runId) {
          this.activeRunId = null;
          this.snapshot = {
            ...this.snapshot,
            status: "ready",
            errorId: null
          };
          eventStream.recordSessionStatus(this.snapshot.status);
          eventStream.recordSessionSnapshot(this.snapshot);
          this.startNextQueuedRun();
        }
      })
      .catch((error) => {
        if (this.activeSession !== session || this.activeRunId !== runId) {
          return;
        }

        this.activeRunId = null;
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

    return runId;
  }

  stopActiveRun(): Promise<StopAgentSessionResult> {
    if (this.abortPromise) {
      return this.abortPromise;
    }

    this.abortPromise = this.abortActiveRun().finally(() => {
      this.abortPromise = null;
    });

    return this.abortPromise;
  }

  async disposeActiveSession(): Promise<DisposeAgentSessionResult> {
    if (this.isActiveRun()) {
      const error = createAppError({
        code: "SESSION_BUSY",
        message: "Stop the active run before changing project folders.",
        recoverable: true
      });

      eventStream.recordError(error);
      return { session: this.snapshot, error };
    }

    const error = await this.dispose();
    return { session: this.snapshot, error };
  }

  async dispose(): Promise<AppError | null> {
    const session = this.activeSession;
    const unsubscribe = this.unsubscribe;

    if (!session) {
      return null;
    }

    try {
      session.dispose();
      unsubscribe?.();
      this.unsubscribe = null;
      this.activeSession = null;
      this.activeRunId = null;
      this.queuedSubmissions = [];
      this.snapshot = {
        ...idleSession(),
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

  private async abortActiveRun(): Promise<StopAgentSessionResult> {
    const session = this.activeSession;

    if (!session || !this.snapshot.id) {
      return { session: this.snapshot, error: null };
    }

    if (!this.isActiveRun()) {
      return { session: this.snapshot, error: null };
    }

    this.snapshot = {
      ...this.snapshot,
      status: "aborting",
      errorId: null
    };
    eventStream.recordSessionStatus(this.snapshot.status);
    eventStream.recordSessionSnapshot(this.snapshot);

    try {
      await session.abort();

      if (this.activeSession === session) {
        this.activeRunId = null;
        this.snapshot = {
          ...this.snapshot,
          status: "stopped",
          errorId: null
        };
        eventStream.recordSessionStatus(this.snapshot.status);
        eventStream.recordSessionSnapshot(this.snapshot);
      }

      return { session: this.snapshot, error: null };
    } catch (error) {
      const appError = createAppError({
        code: "AGENT_SESSION_ABORT_FAILED",
        message: "Could not stop the active Pi AgentSession run.",
        details: error instanceof Error ? error.message : String(error),
        recoverable: true
      });

      if (this.activeSession === session) {
        this.activeRunId = null;
        this.snapshot = {
          ...this.snapshot,
          status: "errored",
          errorId: appError.id
        };
      }

      eventStream.recordError(appError);
      eventStream.recordSessionSnapshot(this.snapshot);
      return { session: this.snapshot, error: appError };
    }
  }

  private isActiveRun(): boolean {
    return Boolean(
      this.activeSession &&
        (this.activeSession.isStreaming || this.snapshot.status === "running" || this.snapshot.status === "aborting")
    );
  }

  private startNextQueuedRun(): void {
    const session = this.activeSession;
    const next = this.queuedSubmissions.shift();

    if (!session || !next) {
      return;
    }

    this.startPromptRun(session, next);
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
        status:
          this.snapshot.status === "aborting" || this.snapshot.status === "stopped"
            ? this.snapshot.status
            : this.activeSession.isStreaming
              ? "running"
              : "ready"
      };
      eventStream.recordSessionSnapshot(this.snapshot);
    }
  }
}

function hasSubmitContent(request: AgentSessionSubmitRequest): boolean {
  return (
    request.text.trim().length > 0 ||
    request.attachments.length > 0 ||
    request.selectedTokens.length > 0
  );
}

function formatSubmitRequestForTranscript(request: AgentSessionSubmitRequest): string {
  return request.text.trim() || "Submitted project context.";
}

function formatSubmitRequestForPi(request: AgentSessionSubmitRequest): string {
  const lines = [request.text.trim()].filter(Boolean);
  const metadata: string[] = [];

  if (request.intent !== "send") {
    metadata.push(`Intent: ${request.intent}`);
  }

  if (request.planMode) {
    metadata.push("Mode: plan");
  }

  if (request.model) {
    metadata.push(`Model: ${request.model.modelId}`);

    if (request.model.thinkingLevel) {
      metadata.push(`Thinking: ${request.model.thinkingLevel}`);
    }
  }

  if (request.selectedTokens.length > 0) {
    metadata.push(
      `Selected context: ${request.selectedTokens
        .map((token) => `${token.kind === "command" ? "/" : "@"}${token.label}`)
        .join(", ")}`
    );
  }

  if (request.attachments.length > 0) {
    metadata.push(
      `Attachments: ${request.attachments
        .map((attachment) => attachment.name)
        .join(", ")}`
    );
  }

  if (metadata.length > 0) {
    lines.push(metadata.join("\n"));
  }

  return lines.join("\n\n");
}

export const agentSessionManager = new AgentSessionManager();
