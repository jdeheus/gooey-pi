import type { WebContents } from "electron";
import { createAppError, type AppError } from "@shared/errors";
import { createAppEventId, type AppEvent, type EventStreamMessage, type EventStreamSnapshot, type RawPiEvent } from "@shared/events";
import { translateRawPiEvent } from "@shared/event-translator";
import type { SessionSnapshot } from "@shared/session";

const MAX_EVENTS = 500;
const CHANNEL = "gooey:events:message";

type RawPiEventInput = { type?: unknown } & object;

class EventStream {
  private targets = new Set<WebContents>();
  private rawEvents: RawPiEvent[] = [];
  private appEvents: AppEvent[] = [];
  private errors: AppError[] = [];
  private rawSequence = 0;
  private appSequence = 0;

  registerTarget(target: WebContents): void {
    this.targets.add(target);
    target.once("destroyed", () => {
      this.targets.delete(target);
    });
  }

  getSnapshot(): EventStreamSnapshot {
    return {
      rawEvents: [...this.rawEvents],
      appEvents: [...this.appEvents],
      errors: [...this.errors]
    };
  }

  clear(): EventStreamSnapshot {
    this.rawEvents = [];
    this.appEvents = [];
    this.errors = [];
    const snapshot = this.getSnapshot();
    this.publish({ type: "cleared", snapshot });
    return snapshot;
  }

  captureRawPiEvent(sessionId: string | null, event: RawPiEventInput): void {
    const type = typeof event.type === "string" ? event.type : "unknown";
    const payload = sanitizeForRenderer(omitType(event));
    const rawEvent: RawPiEvent = {
      id: createAppEventId("raw", ++this.rawSequence),
      sessionId,
      timestamp: new Date().toISOString(),
      type,
      payload
    };

    this.rawEvents = appendBounded(this.rawEvents, rawEvent);
    this.publish({ type: "raw", rawEvent });

    for (const appEvent of translateRawPiEvent(rawEvent, () => createAppEventId("app", ++this.appSequence))) {
      this.recordAppEvent(appEvent);
    }
  }

  recordSessionSnapshot(session: SessionSnapshot): void {
    this.publish({ type: "session", session });
  }

  recordSessionStatus(status: SessionSnapshot["status"]): void {
    this.recordAppEvent({
      id: createAppEventId("app", ++this.appSequence),
      kind: "session.status",
      timestamp: new Date().toISOString(),
      status
    });
  }

  recordError(error: AppError): void {
    this.errors = appendBounded(this.errors.filter((existing) => existing.id !== error.id), error);
    this.publish({ type: "error", error });
    this.recordAppEvent({
      id: createAppEventId("app", ++this.appSequence),
      kind: "error.created",
      timestamp: error.createdAt,
      error
    });
  }

  recordUnknownCaptureError(error: unknown): void {
    this.recordError(
      createAppError({
        code: "UNKNOWN",
        message: "Could not capture a Pi SDK event.",
        details: error instanceof Error ? error.message : String(error),
        recoverable: true
      })
    );
  }

  private recordAppEvent(appEvent: AppEvent): void {
    this.appEvents = appendBounded(this.appEvents, appEvent);
    this.publish({ type: "app", appEvent });
  }

  private publish(message: EventStreamMessage): void {
    for (const target of [...this.targets]) {
      if (target.isDestroyed()) {
        this.targets.delete(target);
        continue;
      }

      target.send(CHANNEL, message);
    }
  }
}

function appendBounded<T>(items: T[], item: T): T[] {
  return [...items, item].slice(-MAX_EVENTS);
}

function omitType(event: RawPiEventInput): Record<string, unknown> {
  const { type: _type, ...payload } = event as Record<string, unknown>;
  return payload;
}

function sanitizeForRenderer(value: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, item) => {
        if (typeof item === "bigint") {
          return item.toString();
        }

        if (item instanceof Error) {
          return {
            name: item.name,
            message: item.message,
            stack: item.stack
          };
        }

        if (typeof item === "function" || typeof item === "symbol") {
          return undefined;
        }

        return item;
      })
    );
  } catch (error) {
    return {
      serializationError: error instanceof Error ? error.message : String(error),
      value: String(value)
    };
  }
}

export const eventStream = new EventStream();
