import { describe, expect, it } from "vitest";
import { createAppEventId } from "./events";
import { translateRawPiEvent } from "./event-translator";

describe("createAppEventId", () => {
  it("creates deterministic padded IDs", () => {
    expect(createAppEventId("evt", 7)).toBe("evt-0007");
  });
});

describe("translateRawPiEvent", () => {
  it("normalizes assistant text deltas", () => {
    const events = translateRawPiEvent(
      {
        id: "raw-0003",
        sessionId: "session-1",
        timestamp: "2026-05-15T17:01:04.000Z",
        type: "message_update",
        payload: {
          assistantMessageEvent: {
            type: "text_delta",
            delta: "hello"
          }
        }
      },
      (_kind) => "app-0001"
    );

    expect(events).toEqual([
      {
        id: "app-0001",
        kind: "message.assistant.delta",
        timestamp: "2026-05-15T17:01:04.000Z",
        rawEventId: "raw-0003",
        messageId: "assistant-session-1",
        delta: "hello"
      }
    ]);
  });

  it("normalizes tool lifecycle events", () => {
    const events = translateRawPiEvent(
      {
        id: "raw-0004",
        sessionId: "session-1",
        timestamp: "2026-05-15T17:01:05.000Z",
        type: "tool_execution_end",
        payload: {
          toolCallId: "call-1",
          toolName: "read",
          result: { ok: true },
          isError: false
        }
      },
      (_kind) => "app-0002"
    );

    expect(events).toEqual([
      {
        id: "app-0002",
        kind: "tool.execution.end",
        timestamp: "2026-05-15T17:01:05.000Z",
        rawEventId: "raw-0004",
        toolCallId: "call-1",
        toolName: "read",
        result: { ok: true },
        isError: false
      }
    ]);
  });
});
