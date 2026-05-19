import { describe, expect, it } from "vitest";
import type { RuntimeTranscriptEvent } from "./chat";
import {
  createRuntimeTranscriptSnapshot,
  replayRuntimeTranscriptSnapshot
} from "./transcript";

describe("runtime transcript snapshots", () => {
  it("replays normalized runtime events in stable sequence order", () => {
    const events: RuntimeTranscriptEvent[] = [
      {
        content: "Done.",
        id: "assistant-1",
        kind: "assistant-message",
        sequence: 3
      },
      {
        id: "tool-1",
        kind: "tool",
        sequence: 2,
        status: "complete",
        summary: "Read project file.",
        title: "read",
        toolName: "read"
      },
      {
        content: "Read the renderer transcript.",
        id: "user-1",
        kind: "user-message",
        sequence: 1
      },
      {
        detail: "Older context was compacted.",
        id: "compaction-1",
        kind: "compaction",
        sequence: 4,
        status: "complete"
      },
      {
        id: "recovery-1",
        kind: "recovery",
        sequence: 5,
        state: "resumed"
      }
    ];

    const snapshot = createRuntimeTranscriptSnapshot({
      createdAt: "2026-05-17T15:00:00.000Z",
      events,
      id: "snapshot-1",
      projectPath: "/mock/project",
      sessionId: "session-1",
      updatedAt: "2026-05-17T15:01:00.000Z"
    });
    const replay = replayRuntimeTranscriptSnapshot(snapshot);

    expect(snapshot.replay).toMatchObject({
      canReplay: true,
      itemCount: 5,
      lastSequence: 5,
      source: "normalized-runtime-events"
    });
    expect(replay.items.map((item) => item.kind)).toEqual([
      "user-message",
      "tool-action",
      "assistant-message",
      "compaction-notice",
      "recovery"
    ]);
  });
});
