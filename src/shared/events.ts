import type { AppError } from "./errors";
import type { SessionStatus } from "./session";

export type AppEventKind =
  | "session.status"
  | "message.user"
  | "message.assistant.delta"
  | "message.assistant.complete"
  | "debug.raw"
  | "error.created";

export interface RawPiEvent {
  id: string;
  sessionId: string | null;
  timestamp: string;
  type: string;
  payload: unknown;
}

export type AppEvent =
  | {
      id: string;
      kind: "session.status";
      timestamp: string;
      rawEventId?: string;
      status: SessionStatus;
    }
  | {
      id: string;
      kind: "message.user";
      timestamp: string;
      messageId: string;
      content: string;
    }
  | {
      id: string;
      kind: "message.assistant.delta";
      timestamp: string;
      rawEventId?: string;
      messageId: string;
      delta: string;
    }
  | {
      id: string;
      kind: "message.assistant.complete";
      timestamp: string;
      rawEventId?: string;
      messageId: string;
    }
  | {
      id: string;
      kind: "debug.raw";
      timestamp: string;
      raw: RawPiEvent;
    }
  | {
      id: string;
      kind: "error.created";
      timestamp: string;
      error: AppError;
    };

export function createAppEventId(prefix: string, sequence: number): string {
  return `${prefix}-${sequence.toString().padStart(4, "0")}`;
}
