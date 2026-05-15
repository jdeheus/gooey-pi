import type { AppError } from "./errors";
import type { SessionSnapshot, SessionStatus } from "./session";

export type AppEventKind =
  | "session.status"
  | "message.user"
  | "message.assistant.delta"
  | "message.assistant.complete"
  | "tool.execution.start"
  | "tool.execution.update"
  | "tool.execution.end"
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
      kind: "tool.execution.start";
      timestamp: string;
      rawEventId?: string;
      toolCallId: string;
      toolName: string;
      args: unknown;
    }
  | {
      id: string;
      kind: "tool.execution.update";
      timestamp: string;
      rawEventId?: string;
      toolCallId: string;
      toolName: string;
      partialResult: unknown;
    }
  | {
      id: string;
      kind: "tool.execution.end";
      timestamp: string;
      rawEventId?: string;
      toolCallId: string;
      toolName: string;
      result: unknown;
      isError: boolean;
    }
  | {
      id: string;
      kind: "error.created";
      timestamp: string;
      error: AppError;
    };

export type EventStreamMessage =
  | { type: "raw"; rawEvent: RawPiEvent }
  | { type: "app"; appEvent: AppEvent }
  | { type: "error"; error: AppError }
  | { type: "session"; session: SessionSnapshot }
  | { type: "cleared"; snapshot: EventStreamSnapshot };

export interface EventStreamSnapshot {
  rawEvents: RawPiEvent[];
  appEvents: AppEvent[];
  errors: AppError[];
}

export function createAppEventId(prefix: string, sequence: number): string {
  return `${prefix}-${sequence.toString().padStart(4, "0")}`;
}
