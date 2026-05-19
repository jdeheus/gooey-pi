import type { AgentSession, AgentSessionEvent } from "@earendil-works/pi-coding-agent";
import { createAppError, type AppError } from "@shared/errors";
import type { PiRuntimeSnapshot } from "@shared/pi";
import { ensurePiRuntimeReady, getPiRuntimeState, getPiSdk } from "./pi-runtime";

export type PiSessionEvent = AgentSessionEvent;

export interface PiSessionHandle {
  readonly isStreaming: boolean;
  readonly sessionFile?: string | null;
  readonly sessionId: string;
  abort(): Promise<void>;
  dispose(): void;
  prompt(prompt: string): Promise<void>;
  subscribe(listener: (event: PiSessionEvent) => void): () => void;
}

export interface CreatePiSessionAdapterResult {
  error: AppError | null;
  runtime: PiRuntimeSnapshot;
  session: PiSessionHandle | null;
}

export interface PiSessionAdapter {
  create(projectPath: string): Promise<CreatePiSessionAdapterResult>;
}

export class LivePiSessionAdapter implements PiSessionAdapter {
  async create(projectPath: string): Promise<CreatePiSessionAdapterResult> {
    const runtime = await ensurePiRuntimeReady();

    if (runtime.status !== "ready") {
      return {
        error:
          runtime.error ??
          createAppError({
            code: "PI_RUNTIME_UNAVAILABLE",
            message: "Pi runtime is not ready.",
            recoverable: true
          }),
        runtime,
        session: null
      };
    }

    try {
      const sdk = await getPiSdk();
      const authStorage = sdk.AuthStorage.create();
      const modelRegistry = sdk.ModelRegistry.create(authStorage);
      const { session } = await sdk.createAgentSession({
        cwd: projectPath,
        authStorage,
        modelRegistry,
        sessionManager: sdk.SessionManager.create(projectPath)
      });

      return {
        error: null,
        runtime: getPiRuntimeState(),
        session: createPiSessionHandle(session)
      };
    } catch (error) {
      return {
        error: createAppError({
          code: "AGENT_SESSION_CREATE_FAILED",
          message: "Could not create a Pi AgentSession.",
          details: error instanceof Error ? error.message : String(error),
          recoverable: true
        }),
        runtime: getPiRuntimeState(),
        session: null
      };
    }
  }
}

function createPiSessionHandle(session: AgentSession): PiSessionHandle {
  return {
    get isStreaming() {
      return session.isStreaming;
    },
    get sessionFile() {
      return session.sessionFile ?? null;
    },
    sessionId: session.sessionId,
    abort: () => session.abort(),
    dispose: () => session.dispose(),
    prompt: (prompt) => session.prompt(prompt),
    subscribe: (listener) => session.subscribe(listener)
  };
}

export const livePiSessionAdapter = new LivePiSessionAdapter();
