import { createAppError, type AppError } from "@shared/errors";
import type {
  AgentSessionSubmitRequest,
  AgentSessionSubmitResult,
  CreateAgentSessionResult,
  DisposeAgentSessionResult,
  StopAgentSessionResult
} from "@shared/pi";
import type { SessionSnapshot } from "@shared/session";
import {
  createRuntimeTaskFailure,
  createRuntimeTaskMetadata,
  type RuntimeChildTask,
  type RuntimeChildTaskStatus,
  type RuntimeMergeSummary,
  type RuntimeParentRun,
  type RuntimeRunStatus,
  type RuntimeTaskGraphSnapshot,
  type RuntimeTaskLifecycleEvent,
  type RuntimeTaskMetadata
} from "@shared/runtime-tasks";
import { eventStream } from "./event-stream";
import {
  livePiSessionAdapter,
  type PiSessionAdapter,
  type PiSessionEvent,
  type PiSessionHandle
} from "./pi-session-adapter";
import { validateProjectFolder } from "./project-folders";
import { getPiRuntimeState } from "./pi-runtime";
import { getRuntimeSettings } from "./runtime-settings";

const MAX_RUNTIME_RUNS = 25;

interface QueuedSubmission {
  request: AgentSessionSubmitRequest;
  taskMetadata: RuntimeTaskMetadata;
}

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
  private activeSession: PiSessionHandle | null = null;
  private unsubscribe: (() => void) | null = null;
  private snapshot: SessionSnapshot = idleSession();
  private abortPromise: Promise<StopAgentSessionResult> | null = null;
  private runSequence = 0;
  private taskSequence = 0;
  private lifecycleSequence = 0;
  private mergeSequence = 0;
  private activeRunId: string | null = null;
  private queuedSubmissions: QueuedSubmission[] = [];
  private taskGraph: RuntimeTaskGraphSnapshot = {
    activeRunId: null,
    runs: [],
    childTasks: [],
    updatedAt: null
  };

  constructor(private readonly sessionAdapter: PiSessionAdapter = livePiSessionAdapter) {}

  getSnapshot(): SessionSnapshot {
    return this.snapshot;
  }

  getRuntimeTaskGraph(): RuntimeTaskGraphSnapshot {
    return {
      activeRunId: this.taskGraph.activeRunId,
      runs: this.taskGraph.runs.map((run) => ({
        ...run,
        childTaskIds: [...run.childTaskIds],
        lifecycle: [...run.lifecycle],
        metadata: {
          ...run.metadata,
          models: { ...run.metadata.models },
          policy: { ...run.metadata.policy }
        },
        mergeSummary: run.mergeSummary
          ? {
              ...run.mergeSummary,
              childTaskIds: [...run.mergeSummary.childTaskIds],
              mergedChildTaskIds: [...run.mergeSummary.mergedChildTaskIds],
              failedChildTaskIds: [...run.mergeSummary.failedChildTaskIds]
            }
          : null
      })),
      childTasks: this.taskGraph.childTasks.map((task) => ({
        ...task,
        lifecycle: [...task.lifecycle],
        progress: { ...task.progress },
        policy: { ...task.policy },
        model: { ...task.model }
      })),
      updatedAt: this.taskGraph.updatedAt
    };
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

    try {
      const disposeError = await this.dispose();

      if (disposeError) {
        return { session: this.snapshot, runtime: getPiRuntimeState(), error: disposeError };
      }

      const created = await this.sessionAdapter.create(validation.path);

      if (created.error || !created.session) {
        const error =
          created.error ??
          createAppError({
            code: "AGENT_SESSION_CREATE_FAILED",
            message: "Could not create a Pi AgentSession.",
            recoverable: true
          });

        this.snapshot = errorSession(validation.path, error);
        eventStream.recordError(error);
        eventStream.recordSessionSnapshot(this.snapshot);
        return { session: this.snapshot, runtime: created.runtime, error };
      }

      const session = created.session;
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

      return { session: this.snapshot, runtime: created.runtime, error: null };
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

  async submitPrompt(request: AgentSessionSubmitRequest): Promise<AgentSessionSubmitResult> {
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
        const taskMetadata = createRuntimeTaskMetadata({
          requestModel: request.model,
          settings: await getRuntimeSettings()
        });
        const messageId = eventStream.recordUserMessage(formatSubmitRequestForTranscript(request));
        this.queuedSubmissions.push({ request, taskMetadata });
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

    const taskMetadata = createRuntimeTaskMetadata({
      requestModel: request.model,
      settings: await getRuntimeSettings()
    });
    const messageId = eventStream.recordUserMessage(formatSubmitRequestForTranscript(request));
    const runId = this.startPromptRun(session, request, taskMetadata);

    return {
      session: this.snapshot,
      messageId,
      runId,
      status: request.intent === "steer" ? "steered" : "accepted",
      error: null
    };
  }

  private startPromptRun(
    session: PiSessionHandle,
    request: AgentSessionSubmitRequest,
    taskMetadata: RuntimeTaskMetadata
  ): string {
    const runId = formatRuntimeTaskId("run", ++this.runSequence);
    const childTaskId = formatRuntimeTaskId("task", ++this.taskSequence);
    this.activeRunId = runId;
    this.snapshot = {
      ...this.snapshot,
      status: "running",
      errorId: null
    };
    this.startRuntimeRun(session, request, taskMetadata, runId, childTaskId);
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
          this.completeRuntimeRun(runId);
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
        this.failRuntimeRun(runId, appError);
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
      this.cancelActiveRuntimeRun("Session disposed before the active run completed.");
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
        const runId = this.activeRunId;
        this.activeRunId = null;
        this.snapshot = {
          ...this.snapshot,
          status: "stopped",
          errorId: null
        };
        if (runId) {
          this.cancelRuntimeRun(runId, "Run stopped by request.");
        }
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
        const runId = this.activeRunId;
        this.activeRunId = null;
        this.snapshot = {
          ...this.snapshot,
          status: "errored",
          errorId: appError.id
        };
        if (runId) {
          this.failRuntimeRun(runId, appError);
        }
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

    this.startPromptRun(session, next.request, next.taskMetadata);
  }

  private startRuntimeRun(
    session: PiSessionHandle,
    request: AgentSessionSubmitRequest,
    taskMetadata: RuntimeTaskMetadata,
    runId: string,
    childTaskId: string
  ): void {
    const timestamp = new Date().toISOString();
    const parentLifecycle = this.createLifecycleEvent({
      taskId: runId,
      stage: "started",
      status: "running",
      timestamp,
      summary: "Parent run started."
    });
    const childLifecycle = this.createLifecycleEvent({
      taskId: childTaskId,
      stage: "started",
      status: "running",
      timestamp,
      summary: "Agent child task started."
    });
    const childTask: RuntimeChildTask = {
      id: childTaskId,
      parentRunId: runId,
      kind: "agent",
      label: "Primary agent task",
      status: "running",
      createdAt: timestamp,
      startedAt: timestamp,
      completedAt: null,
      model: taskMetadata.models.agent,
      policy: taskMetadata.policy,
      progress: {
        currentStep: "Submitting prompt to Pi runtime.",
        completedSteps: 0,
        totalSteps: null
      },
      failure: null,
      mergeSummaryId: null,
      lifecycle: [childLifecycle]
    };
    const parentRun: RuntimeParentRun = {
      id: runId,
      sessionId: session.sessionId,
      projectPath: this.snapshot.projectPath ?? "",
      kind: "parent-run",
      intent: request.intent,
      status: "running",
      createdAt: timestamp,
      startedAt: timestamp,
      completedAt: null,
      promptPreview: createPromptPreview(request),
      model: taskMetadata.models.primary,
      metadata: taskMetadata,
      childTaskIds: [childTaskId],
      mergeSummary: null,
      failure: null,
      lifecycle: [parentLifecycle]
    };
    const nextRuns = appendBoundedRuntimeRuns(this.taskGraph.runs, parentRun);

    this.taskGraph = {
      activeRunId: runId,
      runs: nextRuns,
      childTasks: [...this.taskGraph.childTasks, childTask].filter((task) =>
        nextRuns.some((run) => run.childTaskIds.includes(task.id))
      ),
      updatedAt: timestamp
    };
    this.publishRuntimeTaskGraph();
  }

  private completeRuntimeRun(runId: string): void {
    const timestamp = new Date().toISOString();
    const run = this.taskGraph.runs.find((item) => item.id === runId);

    if (!run) {
      return;
    }

    const childTaskIds = run.childTaskIds;
    const mergeSummary: RuntimeMergeSummary = {
      id: formatRuntimeTaskId("merge", ++this.mergeSequence),
      parentRunId: runId,
      createdAt: timestamp,
      completedAt: timestamp,
      status: "complete",
      childTaskIds,
      mergedChildTaskIds: childTaskIds,
      failedChildTaskIds: [],
      summary: "Runtime completed and merged child task output into the parent run."
    };

    this.taskGraph = {
      activeRunId: this.taskGraph.activeRunId === runId ? null : this.taskGraph.activeRunId,
      runs: this.taskGraph.runs.map((item) =>
        item.id === runId
          ? {
              ...item,
              status: "succeeded",
              completedAt: timestamp,
              mergeSummary,
              lifecycle: [
                ...item.lifecycle,
                this.createLifecycleEvent({
                  taskId: runId,
                  stage: "merged",
                  status: "succeeded",
                  timestamp,
                  summary: "Parent run completed and merged child task output."
                })
              ]
            }
          : item
      ),
      childTasks: this.taskGraph.childTasks.map((task) =>
        task.parentRunId === runId
          ? {
              ...task,
              status: "merged",
              completedAt: timestamp,
              mergeSummaryId: mergeSummary.id,
              progress: {
                ...task.progress,
                currentStep: "Merged into parent run."
              },
              lifecycle: [
                ...task.lifecycle,
                this.createLifecycleEvent({
                  taskId: task.id,
                  stage: "merged",
                  status: "merged",
                  timestamp,
                  summary: "Child task output merged into parent run."
                })
              ]
            }
          : task
      ),
      updatedAt: timestamp
    };
    this.publishRuntimeTaskGraph();
  }

  private failRuntimeRun(runId: string, error: AppError): void {
    const timestamp = new Date().toISOString();
    const failure = createRuntimeTaskFailure(error);
    this.finishRuntimeRun(runId, "failed", timestamp, "Runtime run failed.", failure);
  }

  private cancelActiveRuntimeRun(summary: string): void {
    const runId = this.taskGraph.activeRunId;

    if (runId) {
      this.cancelRuntimeRun(runId, summary);
    }
  }

  private cancelRuntimeRun(runId: string, summary: string): void {
    this.finishRuntimeRun(runId, "canceled", new Date().toISOString(), summary);
  }

  private finishRuntimeRun(
    runId: string,
    status: Extract<RuntimeRunStatus, "failed" | "canceled">,
    timestamp: string,
    summary: string,
    failure?: ReturnType<typeof createRuntimeTaskFailure>
  ): void {
    const childStatus: RuntimeChildTaskStatus = status === "failed" ? "failed" : "canceled";

    this.taskGraph = {
      activeRunId: this.taskGraph.activeRunId === runId ? null : this.taskGraph.activeRunId,
      runs: this.taskGraph.runs.map((run) =>
        run.id === runId
          ? {
              ...run,
              status,
              completedAt: timestamp,
              failure: failure ?? null,
              mergeSummary:
                run.mergeSummary ??
                createIncompleteMergeSummary({
                  id: formatRuntimeTaskId("merge", ++this.mergeSequence),
                  run,
                  status,
                  timestamp,
                  failure
                }),
              lifecycle: [
                ...run.lifecycle,
                this.createLifecycleEvent({
                  taskId: runId,
                  stage: status === "failed" ? "failed" : "canceled",
                  status,
                  timestamp,
                  summary,
                  failure
                })
              ]
            }
          : run
      ),
      childTasks: this.taskGraph.childTasks.map((task) =>
        task.parentRunId === runId && task.status !== "merged"
          ? {
              ...task,
              status: childStatus,
              completedAt: timestamp,
              failure: failure ?? null,
              progress: {
                ...task.progress,
                currentStep: summary
              },
              lifecycle: [
                ...task.lifecycle,
                this.createLifecycleEvent({
                  taskId: task.id,
                  stage: status === "failed" ? "failed" : "canceled",
                  status: childStatus,
                  timestamp,
                  summary,
                  failure
                })
              ]
            }
          : task
      ),
      updatedAt: timestamp
    };
    this.publishRuntimeTaskGraph();
  }

  private recordActiveRunProgress(event: PiSessionEvent): void {
    const runId = this.activeRunId;

    if (!runId) {
      return;
    }

    const type = typeof event.type === "string" ? event.type : "unknown";
    const timestamp = new Date().toISOString();
    const summary = `Pi runtime event: ${type}.`;

    this.taskGraph = {
      ...this.taskGraph,
      childTasks: this.taskGraph.childTasks.map((task) =>
        task.parentRunId === runId && task.status === "running"
          ? {
              ...task,
              progress: {
                ...task.progress,
                currentStep: summary,
                completedSteps: task.progress.completedSteps + 1
              },
              lifecycle: [
                ...task.lifecycle,
                this.createLifecycleEvent({
                  taskId: task.id,
                  stage: "progress",
                  status: task.status,
                  timestamp,
                  summary
                })
              ].slice(-50)
            }
          : task
      ),
      updatedAt: timestamp
    };
    this.publishRuntimeTaskGraph();
  }

  private createLifecycleEvent(input: {
    taskId: string;
    stage: RuntimeTaskLifecycleEvent["stage"];
    status: RuntimeTaskLifecycleEvent["status"];
    timestamp: string;
    summary: string;
    failure?: RuntimeTaskLifecycleEvent["failure"];
  }): RuntimeTaskLifecycleEvent {
    return {
      id: formatRuntimeTaskId("life", ++this.lifecycleSequence),
      taskId: input.taskId,
      stage: input.stage,
      status: input.status,
      timestamp: input.timestamp,
      summary: input.summary,
      ...(input.failure ? { failure: input.failure } : {})
    };
  }

  private publishRuntimeTaskGraph(): void {
    eventStream.recordRuntimeTaskGraph(this.getRuntimeTaskGraph());
  }

  private handleSessionEvent(event: PiSessionEvent): void {
    if (!this.activeSession) {
      return;
    }

    try {
      eventStream.captureRawPiEvent(this.activeSession.sessionId, event);
      this.recordActiveRunProgress(event);
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

function formatRuntimeTaskId(prefix: string, sequence: number): string {
  return `${prefix}-${sequence.toString().padStart(4, "0")}`;
}

function createPromptPreview(request: AgentSessionSubmitRequest): string {
  const text = request.text.trim();

  if (text.length > 0) {
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  }

  if (request.selectedTokens.length > 0) {
    return `Selected context: ${request.selectedTokens.length} item(s).`;
  }

  if (request.attachments.length > 0) {
    return `Attachments: ${request.attachments.length} file(s).`;
  }

  return "Submitted project context.";
}

function appendBoundedRuntimeRuns(
  runs: RuntimeParentRun[],
  run: RuntimeParentRun
): RuntimeParentRun[] {
  return [...runs, run].slice(-MAX_RUNTIME_RUNS);
}

function createIncompleteMergeSummary(input: {
  id: string;
  run: RuntimeParentRun;
  status: Extract<RuntimeRunStatus, "failed" | "canceled">;
  timestamp: string;
  failure?: ReturnType<typeof createRuntimeTaskFailure>;
}): RuntimeMergeSummary {
  return {
    id: input.id,
    parentRunId: input.run.id,
    createdAt: input.timestamp,
    completedAt: input.timestamp,
    status: input.status === "failed" ? "failed" : "canceled",
    childTaskIds: [...input.run.childTaskIds],
    mergedChildTaskIds: [],
    failedChildTaskIds: input.status === "failed" ? [...input.run.childTaskIds] : [],
    summary: input.status === "failed" ? "Runtime failed before merge completed." : "Runtime stopped before merge completed.",
    ...(input.failure ? { failure: input.failure } : {})
  };
}

export const agentSessionManager = new AgentSessionManager();
