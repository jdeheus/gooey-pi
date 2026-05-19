import { describe, expect, it } from "vitest";
import { createMentionOptionsFromContextIndex } from "./context-index";

describe("project context index", () => {
  it("creates renderer-safe mention data from readable files", () => {
    const mentions = createMentionOptionsFromContextIndex({
      readableFiles: [
        {
          id: "file-chat-body",
          kind: "source",
          language: "tsx",
          lineCount: 120,
          projectRelativePath: "src/renderer/surfaces/chat-body.tsx",
          sizeBytes: 4200
        }
      ]
    });

    expect(mentions).toEqual([
      {
        description: "source · tsx · 120 lines",
        id: "file-chat-body",
        kind: "file",
        label: "chat-body.tsx",
        path: "src/renderer/surfaces/chat-body.tsx",
        projectRelativePath: "src/renderer/surfaces/chat-body.tsx",
        sizeBytes: 4200
      }
    ]);
  });
});
