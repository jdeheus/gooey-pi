import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CircleAlertIcon,
  GitBranchIcon,
  TerminalIcon
} from "lucide-react";
import { useState, type ReactElement } from "react";
import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { FrameFooter, FramePanel } from "@renderer/components/ui/frame";
import {
  BASIC_CONVERSATION_ITEMS,
  CHAT_BODY_ATTACHMENTS,
  CHAT_BODY_COMMANDS,
  CHAT_BODY_DEFAULT_METRICS,
  CHAT_BODY_MENTIONS,
  ChatBody,
  ChatComposer,
  ChatHeaderMetrics,
  ChatIconLegend,
  ChatInformationalFrame,
  ChatStatusLegend,
  COMPACTION_NOTICE_ITEMS,
  CompactionNotice,
  CustomSurfaceCard,
  FULL_ACTIVE_CHAT_ITEMS,
  AttachmentTray,
  LONG_MESSAGE_ITEMS,
  MentionPicker as MentionPickerPreview,
  SlashCommandPicker as SlashCommandPickerPreview,
  SUBAGENT_CHAIN_ITEMS,
  SubagentChainSurface,
  THINKING_ITEMS,
  TOOL_ACTION_COMPLETE_ERROR_ITEMS,
  TOOL_ACTION_RUNNING_ITEMS,
  ThinkingPanel,
  ToolActionFrame
} from "@renderer/surfaces/chat-body";
import type {
  ChatAttachment,
  ChatCompactionNoticeItem,
  ChatItem,
  ChatThinkingItem,
  RuntimeTranscriptEvent
} from "@shared/chat";
import {
  createRuntimeTranscriptSnapshot,
  replayRuntimeTranscriptSnapshot
} from "@shared/transcript";

const meta = {
  title: "Surfaces/Chat Body",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const openRuntime7FileExternally = (): void => undefined;

function InformationalFrameBasePreview(): ReactElement {
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <ChatInformationalFrame
          description="Collapsed by default with centered right-side status and chevron."
          icon={<TerminalIcon aria-hidden="true" className="size-4" />}
          onOpenChange={setVerificationOpen}
          open={verificationOpen}
          right={<Badge variant="success">passed</Badge>}
          title="Verification summary"
        >
          <FramePanel className="mx-1 p-4 text-sm leading-6">
            Typecheck, Storybook build, and app build all completed.
          </FramePanel>
        </ChatInformationalFrame>
        <ChatInformationalFrame
          description="Actions stay visible while details above them remain collapsible."
          icon={<GitBranchIcon aria-hidden="true" className="size-4" />}
          onOpenChange={setApprovalOpen}
          open={approvalOpen}
          right={<Badge variant="warning">review</Badge>}
          title="Allow GitHub push?"
          tone="warning"
          footer={(
            <FrameFooter className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="text-muted-foreground text-xs">
                Waiting for approval. Expires in 4 minutes.
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">Deny</Button>
                <Button size="sm">Allow</Button>
              </div>
            </FrameFooter>
          )}
        >
          <FramePanel className="mx-1 p-4 text-sm leading-6">
            Command: git push origin codex/runtime-6-tool-approvals
          </FramePanel>
        </ChatInformationalFrame>
        <ChatInformationalFrame
          description="Danger rows use the same layout with tone-specific border and hover color."
          icon={<CircleAlertIcon aria-hidden="true" className="size-4" />}
          iconClassName="border-destructive/32 bg-destructive/8 text-destructive"
          onOpenChange={setBlockedOpen}
          open={blockedOpen}
          right={<Badge variant="error">destructive</Badge>}
          title="Destructive action blocked"
          tone="danger"
        >
          <FrameFooter className="px-4 py-3 text-muted-foreground text-xs">
            Review the policy, approve manually, or skip the cleanup.
          </FrameFooter>
        </ChatInformationalFrame>
      </div>
    </div>
  );
}

export const InformationalFrameBase: Story = {
  name: "Informational Frame Base",
  render: () => <InformationalFrameBasePreview />
};

const LONG_MARKDOWN_ATTACHMENT: ChatAttachment = {
  description: "Long markdown fixture name",
  id: "renderer-session-state-export",
  kind: "file",
  mimeType: "text/markdown",
  name: "renderer-session-state-export-with-diagnostics-and-event-stream-notes.md",
  previewState: "available",
  previewText:
    "# Renderer session state export\n\n- Project folder: Gooey Pi\n- Runtime: ready\n- Event stream: connected\n- Diagnostics: no warnings",
  source: "project-file",
  uploadStatus: "complete",
  sizeLabel: "18 KB"
};

const CODE_PREVIEW_ATTACHMENT: ChatAttachment = {
  description: "Renderer code excerpt",
  id: "chat-body-code-preview",
  kind: "file",
  mimeType: "text/typescript",
  name: "chat-body.tsx",
  previewState: "available",
  previewText:
    "export function ChatComposer() {\n  return (\n    <InputGroup className=\"flex-col items-stretch\">\n      <InputGroupTextarea placeholder=\"Message Pi...\" />\n    </InputGroup>\n  );\n}",
  sizeLabel: "34 KB",
  source: "project-file",
  uploadStatus: "complete"
};

const UNKNOWN_PREVIEW_ATTACHMENT: ChatAttachment = {
  description: "Binary renderer cache",
  id: "renderer-cache-unknown",
  kind: "file",
  mimeType: "application/octet-stream",
  name: "renderer-cache.bin",
  previewState: "unknown",
  sizeLabel: "2.4 MB",
  source: "local-file",
  uploadStatus: "complete"
};

const UNSUPPORTED_PREVIEW_ATTACHMENT: ChatAttachment = {
  description: "Archive package",
  id: "runtime-archive-unsupported",
  kind: "file",
  mimeType: "application/zip",
  name: "runtime-export.zip",
  previewState: "unsupported",
  sizeLabel: "8.8 MB",
  source: "local-file",
  uploadStatus: "complete"
};

const SELECTED_CONTEXT_ATTACHMENT: ChatAttachment = {
  description: "Selected context token",
  id: "selected-context-chat-body",
  kind: "file",
  mimeType: "text/typescript",
  name: "@chat-body.tsx",
  previewState: "available",
  previewText:
    "Selected token context is attached as renderer-safe metadata and previewed when available.",
  sizeLabel: "context",
  source: "selected-context",
  uploadStatus: "complete"
};

const UPLOADING_ATTACHMENT: ChatAttachment = {
  description: "Uploading screenshot",
  id: "uploading-screenshot",
  kind: "image",
  mimeType: "image/png",
  name: "renderer-screenshot.png",
  previewState: "unknown",
  sizeLabel: "1.2 MB",
  source: "local-file",
  uploadProgress: 64,
  uploadStatus: "uploading"
};

const ERROR_ATTACHMENT: ChatAttachment = {
  description: "Oversized trace",
  errorMessage: "Upload failed. File is too large.",
  id: "error-trace-log",
  kind: "file",
  mimeType: "text/plain",
  name: "renderer-trace.log",
  previewState: "unsupported",
  sizeLabel: "48 MB",
  source: "local-file",
  uploadStatus: "error"
};

const RICH_RUNTIME_EVENTS: RuntimeTranscriptEvent[] = [
  {
    content: "Summarize the renderer transcript and recover if the session stops.",
    id: "runtime-user-request",
    kind: "user-message",
    sequence: 1,
    timestampLabel: "11:04 AM"
  },
  {
    commandLabel: "read src/renderer/surfaces/chat-body.tsx",
    defaultOpen: false,
    detail: "Read 2,640 lines from the renderer chat surface.",
    id: "runtime-tool-read-chat-body",
    kind: "tool",
    sequence: 2,
    status: "complete",
    summary: "Loaded chat body implementation.",
    title: "Read renderer chat surface",
    toolName: "read"
  },
  {
    defaultOpen: true,
    detail:
      "Runtime events are normalized into stable rows before they reach the renderer transcript.",
    id: "runtime-thinking-normalize",
    kind: "thinking",
    sequence: 3,
    status: "working",
    summary: "Mapping runtime payloads into renderer-safe rows.",
    title: "Working"
  },
  {
    agents: [
      {
        durationLabel: "5.9s",
        id: "runtime-agent-scout",
        model: "gpt-5.5",
        name: "scout",
        role: "Collect renderer files",
        status: "complete",
        toolsLabel: "2 tools"
      },
      {
        id: "runtime-agent-planner",
        model: "gpt-5.5",
        name: "planner",
        role: "Prepare transcript map",
        status: "running",
        toolsLabel: "pending"
      }
    ],
    defaultOpen: false,
    id: "runtime-subagents",
    kind: "subagent-chain",
    sequence: 4,
    status: "running",
    summary: "Subagent progress remains visible while details are collapsed.",
    title: "subagent chain (2)"
  },
  {
    detail: "Older transcript context is being summarized before the run continues.",
    id: "runtime-compaction",
    kind: "compaction",
    sequence: 5,
    status: "running",
    summary: "Preparing compacted context.",
    title: "Compacting context"
  },
  {
    customType: "extension-payload",
    description:
      "Unknown extension payloads render as readable fallback content until a custom view is added.",
    detailLines: ["extension: custom-review", "payload: renderer-safe", "view: fallback"],
    id: "runtime-custom-extension",
    kind: "custom",
    sequence: 6,
    status: "queued",
    title: "Extension payload"
  },
  {
    content:
      "I normalized the runtime payloads and kept the transcript rows stable across updates.",
    costLabel: "$0.05",
    id: "runtime-assistant-response",
    kind: "assistant-message",
    modelLabel: "GPT-5.5",
    sequence: 7,
    thinkingLevelLabel: "medium",
    timestampLabel: "11:05 AM"
  }
];

const RICH_RUNTIME_SNAPSHOT = createRuntimeTranscriptSnapshot({
  createdAt: "2026-05-17T15:04:00.000Z",
  events: RICH_RUNTIME_EVENTS,
  id: "transcript-snapshot-runtime-replay",
  projectPath: "/mock/projects/gooey-pi",
  sessionId: "session-runtime-replay",
  updatedAt: "2026-05-17T15:05:00.000Z"
});

const TRANSCRIPT_RECOVERY_ITEMS: ChatItem[] = [
  {
    content: "Please continue the renderer review after the runtime reconnects.",
    id: "recovery-user-message",
    kind: "user-message",
    timestampLabel: "11:08 AM"
  },
  {
    actions: [
      { id: "retry-run", label: "Retry" },
      { id: "copy-details", label: "Copy details" }
    ],
    detail: "The previous transcript remains visible and can be retried.",
    id: "recovery-failed",
    kind: "recovery",
    message: "The runtime returned a startup failure.",
    state: "failed",
    title: "Run failed"
  },
  {
    detail: "The active run was stopped before tool execution completed.",
    id: "recovery-stopped",
    kind: "recovery",
    message: "Stopped by user request.",
    state: "stopped",
    title: "Run stopped"
  },
  {
    detail: "The resumed transcript starts from the latest accepted assistant row.",
    id: "recovery-resumed",
    kind: "recovery",
    message: "Runtime reconnected and restored the session.",
    state: "resumed",
    title: "Session resumed"
  },
  {
    detail: "The adapter ended the run before it reached a terminal assistant message.",
    id: "recovery-aborted",
    kind: "recovery",
    message: "The run was aborted before completion.",
    state: "aborted",
    title: "Run aborted"
  }
];

const DENSE_TRANSCRIPT_ITEMS: ChatItem[] = Array.from({ length: 8 }, (_, index) => {
  const step = index + 1;
  const minute = String(10 + step).padStart(2, "0");

  return [
    {
      content:
        `Review renderer pass ${step} and keep the transcript stable while tools, thinking, and assistant output update.`,
      id: `dense-user-${step}`,
      kind: "user-message",
      timestampLabel: `11:${minute} AM`
    },
    {
      commandLabel: `read src/renderer/surfaces/chat-body.tsx --section ${step}`,
      defaultOpen: false,
      detail:
        "Collapsed tool details remain keyboard-expandable without changing the transcript width.",
      id: `dense-tool-${step}`,
      kind: "tool-action",
      status: step % 3 === 0 ? "running" : "complete",
      summary: "Renderer section loaded.",
      title: "Read renderer section",
      toolName: "read"
    },
    {
      defaultOpen: false,
      detail:
        "Dense transcripts should preserve scan-friendly spacing, focus rings, and readable metadata.",
      id: `dense-thinking-${step}`,
      kind: "thinking",
      status: step % 4 === 0 ? "working" : "complete",
      summary: "Checking transcript density and keyboard affordances.",
      title: step % 4 === 0 ? "Working" : "Thinking"
    },
    {
      content:
        "The transcript row contracts stay stable: user messages, tool rows, thinking rows, and assistant replies all keep their readable measure.",
      costLabel: "$0.01",
      id: `dense-assistant-${step}`,
      kind: "assistant-message",
      modelLabel: "GPT-5.5",
      thinkingLevelLabel: "medium",
      timestampLabel: `11:${minute} AM`
    }
  ] satisfies ChatItem[];
}).flat();

const BASE_SUBAGENT_CHAIN_ITEM = SUBAGENT_CHAIN_ITEMS[0] as Extract<
  ChatItem,
  { kind: "subagent-chain" }
>;

const SUBAGENT_CHAIN_RUNNING_ORCHESTRATION_ITEM: Extract<
  ChatItem,
  { kind: "subagent-chain" }
> = {
  ...BASE_SUBAGENT_CHAIN_ITEM,
  agents: [
    {
      activity: [
        {
          description: "Read the renderer surface files that define App Frame and Chat Body.",
          id: "subagent-scout-activity-1",
          status: "complete",
          timeLabel: "11:18 AM",
          title: "Collected renderer files"
        },
        {
          description: "Found the subagent chain component and the Storybook fixtures that exercise it.",
          id: "subagent-scout-activity-2",
          status: "complete",
          timeLabel: "11:19 AM",
          title: "Mapped relevant stories"
        }
      ],
      durationLabel: "5.9s",
      id: "subagent-scout",
      model: "gpt-5.5",
      name: "scout",
      role: "Collect renderer files",
      status: "complete",
      toolsLabel: "2 tools"
    },
    {
      activity: [
        {
          description: "Compared runtime transcript rows against the subagent orchestration plan.",
          id: "subagent-planner-activity-1",
          status: "running",
          timeLabel: "11:19 AM",
          title: "Reviewing transcript mapping"
        }
      ],
      id: "subagent-planner",
      model: "gpt-5.5",
      name: "planner",
      role: "Map orchestration transcript",
      status: "running",
      toolsLabel: "1 tool"
    },
    {
      id: "subagent-verifier",
      model: "gpt-5.5-mini",
      name: "verifier",
      role: "Check Storybook coverage gaps",
      status: "queued",
      toolsLabel: "pending"
    }
  ],
  id: "subagent-chain-running-orchestration",
  summary: "Subagents show staged orchestration progress while the transcript remains readable.",
  title: "subagent chain (3)"
};

const SUBAGENT_CHAIN_COMPLETE_WITH_MERGE_SUMMARY_ITEMS: ChatItem[] = [
  {
    content:
      "Run the subagent orchestration slice and merge the results back into the main transcript.",
    id: "subagent-merge-user",
    kind: "user-message",
    timestampLabel: "11:18 AM"
  },
  {
    ...BASE_SUBAGENT_CHAIN_ITEM,
    agents: [
      {
        durationLabel: "5.9s",
        id: "subagent-scout",
        model: "gpt-5.5",
        name: "scout",
        role: "Collect renderer files",
        status: "complete",
        toolsLabel: "2 tools"
      },
      {
        durationLabel: "7.1s",
        id: "subagent-planner",
        model: "gpt-5.5",
        name: "planner",
        role: "Map orchestration transcript",
        status: "complete",
        toolsLabel: "3 tools"
      },
      {
        durationLabel: "3.4s",
        id: "subagent-verifier",
        model: "gpt-5.5-mini",
        name: "verifier",
        role: "Check Storybook coverage gaps",
        status: "complete",
        toolsLabel: "1 tool"
      }
    ],
    id: "subagent-chain-complete-with-merge",
    kind: "subagent-chain",
    status: "complete",
    summary: "All subagents completed and their findings were merged into one handoff.",
    title: "subagent chain complete (3)"
  },
  {
    content:
      "Merged scout file inventory, planner transcript sequencing, and verifier Storybook coverage notes into one runtime handoff. No main, preload, or shared runtime contract files were required.",
    id: "subagent-merge-summary",
    kind: "summary",
    summaryType: "branch",
    title: "Merge summary"
  },
  {
    content:
      "The orchestration branch is complete. The transcript now shows the completed chain and the merged result as a follow-on summary row.",
    id: "subagent-merge-assistant",
    kind: "assistant-message",
    modelLabel: "GPT-5.5",
    thinkingLevelLabel: "medium",
    timestampLabel: "11:20 AM"
  }
];

const SUBAGENT_CHAIN_ERROR_STATE_ITEMS: ChatItem[] = [
  {
    content: "Try the subagent review, but keep partial results visible if one branch fails.",
    id: "subagent-error-user",
    kind: "user-message",
    timestampLabel: "11:24 AM"
  },
  {
    ...BASE_SUBAGENT_CHAIN_ITEM,
    agents: [
      {
        durationLabel: "4.8s",
        id: "subagent-scout-error-flow",
        model: "gpt-5.5",
        name: "scout",
        role: "Collect renderer files",
        status: "complete",
        toolsLabel: "2 tools"
      },
      {
        durationLabel: "2.3s",
        id: "subagent-planner-error-flow",
        model: "gpt-5.5",
        name: "planner",
        role: "Map orchestration transcript",
        status: "error",
        toolsLabel: "tool failed"
      },
      {
        id: "subagent-verifier-cancelled-flow",
        model: "gpt-5.5-mini",
        name: "verifier",
        role: "Check Storybook coverage gaps",
        status: "cancelled",
        toolsLabel: "cancelled"
      }
    ],
    id: "subagent-chain-error-partial",
    kind: "subagent-chain",
    status: "error",
    summary: "One subagent failed while completed and cancelled branches remain visible.",
    title: "subagent chain error (3)"
  },
  {
    detail:
      "planner could not read the mocked transcript fixture. scout results remain available and verifier was cancelled before tool execution. Retry should be user-initiated from the failed branch after the user reviews the partial result.",
    id: "subagent-chain-error-detail",
    kind: "error",
    message: "Subagent chain stopped with partial results.",
    title: "Subagent orchestration failed"
  }
];

const SUBAGENT_CHAIN_RETRY_AVAILABLE_ITEM: Extract<
  ChatItem,
  { kind: "subagent-chain" }
> = {
  ...BASE_SUBAGENT_CHAIN_ITEM,
  action: {
    id: "retry-subagent-chain",
    label: "Retry"
  },
  agents: [
    {
      id: "subagent-scout-retry",
      model: "gpt-5.5",
      name: "scout",
      role: "Collect renderer files",
      status: "queued",
      toolsLabel: "queued"
    },
    {
      id: "subagent-planner-retry",
      model: "gpt-5.5",
      name: "planner",
      role: "Map orchestration transcript",
      status: "queued",
      toolsLabel: "queued"
    }
  ],
  defaultOpen: false,
  id: "subagent-chain-error-retry-available",
  kind: "subagent-chain",
  status: "queued",
  summary:
    "Retry is manual. Selecting Retry queues a fresh subagent chain while the failed chain remains visible.",
  title: "subagent chain retry available (2)"
};

const VERIFICATION_SUMMARY_ITEMS: ChatItem[] = [
  {
    checks: [
      {
        command: "corepack pnpm typecheck",
        durationLabel: "18.4s",
        id: "verification-typecheck",
        label: "Typecheck",
        status: "passed"
      },
      {
        command: "corepack pnpm storybook:build",
        durationLabel: "31.2s",
        id: "verification-storybook",
        label: "Storybook build",
        outputSummary: "Completed with the existing Vite chunk-size warning.",
        status: "passed"
      },
      {
        command: "corepack pnpm build",
        durationLabel: "24.7s",
        id: "verification-app-build",
        label: "App build",
        status: "passed"
      }
    ],
    id: "verification-summary-runtime-5",
    kind: "verification-summary",
    status: "passed",
    summary: "Runtime verification passed and GitHub automation can continue.",
    title: "Verification summary"
  }
];

const GITHUB_AUTOMATION_READY_ITEMS: ChatItem[] = [
  ...VERIFICATION_SUMMARY_ITEMS,
  {
    autoPushEnabled: false,
    branch: "codex/runtime-5-github-automation",
    checkStatus: "passed",
    files: [
      { path: "src/main/git-runtime.ts", status: "added" },
      { path: "src/shared/github-automation.ts", status: "added" },
      { path: "src/renderer/surfaces/chat-body.tsx", status: "modified" },
      { path: "src/renderer/chat-body.stories.tsx", status: "modified" },
      { path: "src/renderer/surfaces/app-frame.tsx", status: "modified" }
    ],
    id: "github-automation-ready-runtime-5",
    kind: "github-automation-ready",
    nextAction: "push",
    summary: "Checks passed. Pi can push the verified branch after approval.",
    title: "GitHub automation ready"
  }
];

const GITHUB_AUTOMATION_ERROR_ITEMS: ChatItem[] = [
  {
    failure: {
      detail:
        "The branch could not pull cleanly because remote changes conflict with local generated files.",
      kind: "pull-conflict",
      operation: "pull",
      recoveryAction: "Review the conflict summary, keep the current draft, and choose whether Pi should rebase or stop.",
      title: "Pull conflict blocked GitHub automation"
    },
    id: "github-automation-error-pull-conflict",
    kind: "github-automation-error"
  },
  {
    failure: {
      detail: "Storybook failed before the branch was eligible for auto-push.",
      kind: "failed-checks",
      operation: "push",
      recoveryAction: "Open verification details, fix the failing story, and rerun checks.",
      title: "Checks failed before push"
    },
    id: "github-automation-error-failed-checks",
    kind: "github-automation-error"
  },
  {
    failure: {
      detail: "GitHub credentials were unavailable for the current desktop session.",
      kind: "auth",
      operation: "push",
      recoveryAction: "Reconnect GitHub or approve a manual push from the terminal.",
      title: "GitHub authentication required"
    },
    id: "github-automation-error-auth",
    kind: "github-automation-error"
  }
];

const TOOL_APPROVAL_REQUEST_ITEMS: ChatItem[] = [
  {
    content: "Let Pi push this branch after the checks pass.",
    id: "approval-user-request",
    kind: "user-message",
    timestampLabel: "11:36 AM"
  },
  {
    id: "tool-approval-request-push",
    kind: "tool-approval-request",
    request: {
      actionLabel: "Push branch to GitHub",
      canRemember: true,
      category: "github",
      commandPreview: "git push origin codex/runtime-6-tool-approvals",
      expiresAtLabel: "in 4 minutes",
      id: "approval-request-push-runtime-6",
      projectLabel: "Gooey Pi",
      requester: "Pi",
      risk: "elevated",
      status: "pending",
      summary: "Pi wants to push the verified Runtime 6 branch to GitHub.",
      targetLabel: "origin/codex/runtime-6-tool-approvals",
      title: "Allow GitHub push?"
    }
  }
];

const TOOL_APPROVAL_BLOCKED_ITEMS: ChatItem[] = [
  {
    id: "tool-approval-blocked-delete",
    blocked: {
      actionLabel: "Delete generated Storybook output",
      category: "destructive",
      detail:
        "The permission policy blocked this delete because destructive actions cannot be auto-approved. Review the request, adjust permissions, or skip the cleanup.",
      id: "blocked-delete-storybook-static",
      recoveryActions: [
        { id: "review-request", label: "Review" },
        { id: "adjust-settings", label: "Settings" },
        { id: "skip-action", label: "Skip" }
      ],
      risk: "destructive",
      summary: "Pi tried to delete generated files, but destructive actions require explicit approval.",
      title: "Destructive action blocked"
    },
    kind: "tool-approval-blocked"
  },
  {
    id: "tool-approval-blocked-network",
    blocked: {
      actionLabel: "Download package metadata",
      category: "network",
      detail:
        "Network access is disabled for this run. Pi can continue with cached package metadata or ask again after permissions change.",
      id: "blocked-network-package-metadata",
      recoveryActions: [
        { id: "approve-network", label: "Approve" },
        { id: "use-cache", label: "Use cache" }
      ],
      risk: "elevated",
      summary: "Network access was blocked by the current permission policy.",
      title: "Network action blocked"
    },
    kind: "tool-approval-blocked"
  }
];

const CHANGE_REVIEW_FILES = [
  {
    additions: 128,
    deletions: 34,
    impact: "high",
    path: "src/renderer/surfaces/chat-body.tsx",
    status: "modified",
    summary: "Shared informational row and change review surfaces updated."
  },
  {
    additions: 76,
    deletions: 4,
    impact: "medium",
    path: "src/shared/change-review.ts",
    status: "added",
    summary: "Typed change summary, diff, checkpoint, and recovery contracts added."
  },
  {
    additions: 52,
    deletions: 0,
    impact: "medium",
    path: "src/main/change-review.ts",
    status: "added",
    summary: "Main-process git summary and checkpoint service added."
  },
  {
    additions: 18,
    deletions: 2,
    impact: "low",
    path: "src/preload/index.ts",
    status: "modified",
    summary: "Renderer-safe change review APIs exposed."
  },
  {
    additions: 22,
    deletions: 6,
    impact: "low",
    path: "src/shared/app-api.ts",
    status: "modified",
    summary: "Renderer bridge contract updated for change review actions."
  }
] satisfies Extract<ChatItem, { kind: "change-summary" }>["files"];

const BASE_CHANGE_SUMMARY_ITEM: Extract<ChatItem, { kind: "change-summary" }> = {
  branch: "codex/runtime-7-change-review",
  files: CHANGE_REVIEW_FILES.slice(0, 4),
  id: "change-summary-runtime-7",
  kind: "change-summary",
  summary: "4 changed files, including 1 high-impact renderer file.",
  title: "Change summary"
};

const CHANGE_SUMMARY_ITEMS: ChatItem[] = [BASE_CHANGE_SUMMARY_ITEM];

const BACKGROUND_TASK_STATUS_ITEMS: ChatItem[] = [
  {
    detail:
      "Pi is still running verification in the background. This task can continue while the chat remains available.",
    id: "background-task-running",
    kind: "background-task",
    projectLabel: "Gooey Pi",
    status: "running",
    summary: "Verification is still running while you review the transcript.",
    title: "Verification running"
  },
  {
    detail:
      "The generated branch is resumable after the renderer reconnects. Pi will pick up from the last accepted checkpoint.",
    id: "background-task-resumable",
    kind: "background-task",
    projectLabel: "Gooey Pi",
    status: "resumable",
    summary: "Work can resume from the last runtime checkpoint.",
    title: "Runtime task resumable"
  },
  {
    detail:
      "The GitHub push could not complete because credentials need to be refreshed before retrying.",
    id: "background-task-attention",
    kind: "background-task",
    projectLabel: "Gooey Pi",
    status: "needs-attention",
    summary: "GitHub authentication needs attention before automation can continue.",
    title: "Push needs attention"
  },
  {
    detail:
      "The background run completed and emitted a notification-ready event for the renderer shell.",
    id: "background-task-complete",
    kind: "background-task",
    projectLabel: "Gooey Pi",
    status: "completed",
    summary: "Checks passed and the background task is complete.",
    title: "Background work complete"
  }
];

const OPERATOR_RUN_LIFECYCLE_ITEMS: ChatItem[] = [
  {
    content: "Please finish Runtime 9, verify it, and get the branch ready for GitHub.",
    id: "operator-run-user-request",
    kind: "user-message",
    timestampLabel: "12:08 PM"
  },
  {
    id: "operator-run-runtime-9",
    kind: "operator-run",
    run: {
      actions: [
        { id: "open-review", label: "Open review" },
        { id: "approve-github-push", label: "Approve", tone: "primary" }
      ],
      activeStepId: "operator-run-step-approval",
      chatId: "chat-runtime-9",
      id: "operator-run-runtime-9",
      objective: "Implement Runtime 9 operator lifecycle wiring and prepare the branch for review.",
      projectId: "project-gooey-pi",
      projectLabel: "Gooey Pi",
      runId: "runtime-9-operator-run",
      stage: "waiting-approval",
      startedAtLabel: "12:04 PM",
      steps: [
        {
          id: "operator-run-step-accepted",
          reference: {
            id: "composer-submit-runtime-9",
            kind: "background-task",
            label: "request"
          },
          status: "completed",
          summary: "Prompt accepted with model, plan mode, attachments, and project metadata.",
          title: "Run accepted"
        },
        {
          id: "operator-run-step-agents",
          reference: {
            id: "subagent-chain-runtime-9",
            kind: "subagent-chain",
            label: "agents"
          },
          status: "completed",
          summary: "Subagents finished implementation and review tasks.",
          title: "Agents completed"
        },
        {
          id: "operator-run-step-verification",
          reference: {
            id: "verification-summary-runtime-9",
            kind: "verification",
            label: "checks"
          },
          status: "completed",
          summary: "Typecheck, Storybook build, and app build passed.",
          title: "Verification passed"
        },
        {
          id: "operator-run-step-approval",
          reference: {
            id: "approval-request-runtime-9",
            kind: "approval",
            label: "approval"
          },
          status: "needs-attention",
          summary: "Pi needs approval before pushing the verified branch.",
          title: "Waiting for GitHub approval"
        },
        {
          id: "operator-run-step-automation",
          reference: {
            id: "github-automation-runtime-9",
            kind: "github-automation",
            label: "GitHub"
          },
          status: "queued",
          summary: "Push or PR automation starts after approval.",
          title: "GitHub automation"
        }
      ],
      summary: "Verification passed. Pi is waiting for approval before GitHub automation continues.",
      title: "Operator run lifecycle"
    },
    timestampLabel: "12:11 PM"
  },
  {
    id: "operator-run-resumable-runtime-9",
    kind: "operator-run",
    run: {
      actions: [
        { id: "resume-run", label: "Resume run", tone: "primary" }
      ],
      activeStepId: "operator-run-step-resume",
      chatId: "chat-runtime-9",
      id: "operator-run-resumable-runtime-9",
      objective: "Resume the generated branch after the renderer reconnects.",
      projectId: "project-gooey-pi",
      projectLabel: "Gooey Pi",
      recovery: {
        actionLabel: "Resume run",
        detail:
          "The renderer reconnected after verification completed. Pi can continue from the last accepted checkpoint without losing the generated branch.",
        reason: "runtime-reconnect",
        title: "Run can resume"
      },
      runId: "runtime-9-resumable",
      stage: "resumable",
      steps: [
        {
          id: "operator-run-step-resume",
          reference: {
            id: "background-task-resumable",
            kind: "background-task",
            label: "resume"
          },
          status: "running",
          summary: "Pi is restoring the last accepted runtime checkpoint.",
          title: "Resume checkpoint"
        },
        {
          id: "operator-run-step-recheck",
          reference: {
            id: "verification-summary-resume",
            kind: "verification",
            label: "checks"
          },
          status: "queued",
          summary: "Verification will rerun before any GitHub automation.",
          title: "Re-run verification"
        }
      ],
      summary: "Work is resumable from the last accepted checkpoint.",
      title: "Operator run recovery"
    },
    timestampLabel: "12:19 PM"
  }
];

const CHANGE_REVIEW_DIFF_ITEMS: ChatItem[] = [
  {
    files: [
      {
        additions: 8,
        deletions: 2,
        language: "tsx",
        lines: [
          { content: "function ChangeSummaryFrame({ item }) {", kind: "context", lineNumber: 1 },
          { content: "  const [open, setOpen] = useState(false);", kind: "context", lineNumber: 2 },
          { content: "  return <Frame>{item.title}</Frame>;", kind: "removed", lineNumber: 3 },
          { content: "  return (", kind: "added", lineNumber: 3 },
          { content: "    <ChatInformationalFrame title={item.title}>", kind: "added", lineNumber: 4 },
          { content: "      <FramePanel>{item.summary}</FramePanel>", kind: "added", lineNumber: 5 },
          { content: "    </ChatInformationalFrame>", kind: "added", lineNumber: 6 },
          { content: "  );", kind: "added", lineNumber: 7 },
          { content: "}", kind: "context", lineNumber: 8 }
        ],
        path: "src/renderer/surfaces/chat-body.tsx",
        status: "modified"
      }
    ],
    id: "change-review-diff-runtime-7",
    kind: "change-review-diff",
    summary: "Optional Tier 2 diff review for the changed renderer surface.",
    title: "Change review"
  }
];

const CHECKPOINT_UNDO_CONFIRMATION_ITEMS: ChatItem[] = [
  {
    checkpoint: {
      baseHead: "8b3f38a1d7f0a4a395f9fb9d7d5a0a3f0b8d41e2",
      branch: "codex/runtime-7-change-review",
      createdAt: "2026-05-18T18:30:00.000Z",
      id: "checkpoint-before-github-push",
      projectPath: "/Users/jdeheus/Documents/Gooey-Pi",
      runId: "runtime-7-review",
      status: {
        ahead: 1,
        behind: 0,
        branch: "codex/runtime-7-change-review",
        checkedAt: "2026-05-18T18:30:00.000Z",
        clean: false,
        files: CHANGE_REVIEW_FILES.map(({ path, status }) => ({ path, status })),
        projectPath: "/Users/jdeheus/Documents/Gooey-Pi",
        remote: "origin"
      },
      type: "before-push"
    },
    files: CHANGE_REVIEW_FILES.slice(0, 3),
    id: "checkpoint-undo-confirmation-runtime-7",
    kind: "checkpoint-undo-confirmation",
    summary: "Restore the pre-push checkpoint if the generated changes are not wanted.",
    title: "Undo checkpoint"
  }
];

const CHANGE_RECOVERY_ITEMS: ChatItem[] = [
  {
    id: "change-recovery-conflict",
    kind: "change-recovery",
    recovery: {
      actions: [
        { id: "keep-current", label: "Keep current" },
        { id: "open-details", label: "Open details" }
      ],
      detail:
        "Pi should stop automation until you choose whether to keep local generated work or resolve the pull conflict manually.",
      files: [
        {
          additions: 24,
          deletions: 18,
          impact: "high",
          path: "src/renderer/surfaces/chat-body.tsx",
          status: "unmerged",
          summary: "Local generated changes conflict with remote edits."
        }
      ],
      id: "change-recovery-pull-conflict",
      kind: "conflict",
      summary: "A pull conflict is blocking GitHub automation.",
      title: "Change recovery needed"
    }
  },
  {
    id: "change-recovery-revert-failed",
    kind: "change-recovery",
    recovery: {
      actions: [
        { id: "retry-undo", label: "Retry undo" },
        { id: "skip-undo", label: "Skip undo" }
      ],
      detail:
        "The checkpoint could not be restored automatically. The current draft remains visible and no files were silently discarded.",
      files: [
        {
          additions: 12,
          deletions: 8,
          impact: "medium",
          path: "src/main/change-review.ts",
          status: "modified",
          summary: "Checkpoint restore failed while applying generated runtime changes."
        }
      ],
      id: "change-recovery-revert-failed",
      kind: "revert-failed",
      summary: "Undo failed and needs manual confirmation.",
      title: "Checkpoint restore failed"
    }
  },
  {
    id: "change-recovery-unmergeable",
    kind: "change-recovery",
    recovery: {
      actions: [
        { id: "keep-draft", label: "Keep draft" },
        { id: "stop-automation", label: "Stop automation" }
      ],
      detail:
        "Pi cannot merge the generated branch automatically. Keep the current draft visible and choose a manual recovery path before pushing.",
      files: [
        {
          additions: 36,
          deletions: 20,
          impact: "high",
          path: "src/shared/change-review.ts",
          status: "unmerged",
          summary: "Generated runtime contracts cannot be merged automatically."
        },
        {
          additions: 14,
          deletions: 6,
          impact: "medium",
          path: "src/main/change-review.ts",
          status: "modified",
          summary: "Main-process checkpoint state needs manual recovery."
        }
      ],
      id: "change-recovery-unmergeable",
      kind: "unmergeable",
      summary: "The generated branch is not mergeable without review.",
      title: "Change set is unmergeable"
    }
  }
];

export const HeaderMetrics: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle="Project setup"
        metrics={CHAT_BODY_DEFAULT_METRICS}
      />
    </div>
  )
};

export const HeaderMetricsLongTitle: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle="Renderer session state export with diagnostics and event stream notes"
        metrics={CHAT_BODY_DEFAULT_METRICS}
      />
    </div>
  )
};

export const HeaderMetricsTitleEditState: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle="Project setup"
        initialRenamingTitle
        metrics={CHAT_BODY_DEFAULT_METRICS}
        onChatTitleRename={() => undefined}
      />
    </div>
  )
};

export const HeaderMetricsHighContext: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle="Project setup"
        metrics={{ ...CHAT_BODY_DEFAULT_METRICS, contextPercent: 92, cost: 12.9876 }}
      />
    </div>
  )
};

export const HeaderMetricsApiBilling: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle="Project setup"
        metrics={{ ...CHAT_BODY_DEFAULT_METRICS, billingSources: ["api"] }}
      />
    </div>
  )
};

export const HeaderMetricsMixedBilling: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle="Project setup"
        metrics={{
          ...CHAT_BODY_DEFAULT_METRICS,
          billingSources: ["subscription", "api"]
        }}
      />
    </div>
  )
};

export const HeaderMetricsCompacting: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle="Project setup"
        metrics={{ ...CHAT_BODY_DEFAULT_METRICS, contextPercent: 78, isCompacting: true }}
      />
    </div>
  )
};

export const HeaderMetricsUnavailable: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle="Project setup"
        metrics={{ ...CHAT_BODY_DEFAULT_METRICS, contextPercent: 0, isUnavailable: true }}
      />
    </div>
  )
};

export const HeaderMetricsManyCompactions: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle="Project setup"
        metrics={{
          ...CHAT_BODY_DEFAULT_METRICS,
          compactions: [
            ...(CHAT_BODY_DEFAULT_METRICS.compactions ?? []),
            {
              id: "second-compaction",
              providerCosts: [
                { cost: 1.62, provider: "Anthropic", tokens: 9_600 },
                { cost: 1.21, provider: "OpenAI", tokens: 7_200 },
                { cost: 0.42, provider: "Local", tokens: 2_400 }
              ],
              timestampLabel: "Yesterday",
              title: "Second compaction"
            },
            {
              id: "third-compaction",
              providerCosts: [
                { cost: 0.86, provider: "OpenAI", tokens: 4_800 },
                { cost: 0.37, provider: "Local", tokens: 2_100 },
                { cost: 0.22, provider: "Anthropic", tokens: 1_200 }
              ],
              timestampLabel: "May 14",
              title: "Third compaction"
            }
          ],
          contextPercent: 84
        }}
      />
    </div>
  )
};

export const HeaderMetricsRuntimeUsage: Story = {
  name: "Header Metrics Runtime Usage",
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle="Runtime usage"
        metrics={{
          billingSources: ["api", "subscription"],
          compactions: [
            {
              id: "runtime-compaction-current",
              providerCosts: [
                { cost: 2.74, provider: "OpenAI", tokens: 50_600 },
                { cost: 1.34, provider: "DeepSeek", tokens: 84_200 },
                { cost: 0.58, provider: "Local", tokens: 16_400 }
              ],
              timestampLabel: "now",
              title: "Current compaction"
            }
          ],
          contextPercent: 74,
          cost: 4.66,
          tokens: 151_200
        }}
      />
    </div>
  )
};

export const EmptyTranscript: Story = {
  render: () => <ChatBody items={[]} metrics={CHAT_BODY_DEFAULT_METRICS} />
};

export const BasicConversation: Story = {
  render: () => (
    <ChatBody items={BASIC_CONVERSATION_ITEMS} metrics={CHAT_BODY_DEFAULT_METRICS} />
  )
};

export const SubmittedUserMessageTextOnly: Story = {
  render: () => (
    <ChatBody
      items={[
        {
          content: "Review the active renderer state and summarize what changed.",
          id: "submitted-user-text",
          kind: "user-message",
          timestampLabel: "10:41 AM"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const SubmittedUserMessageMixedPayload: Story = {
  render: () => (
    <ChatBody
      items={[
        {
          attachments: [
            CHAT_BODY_ATTACHMENTS[0],
            LONG_MARKDOWN_ATTACHMENT,
            SELECTED_CONTEXT_ATTACHMENT
          ],
          content:
            "Review @chat-body.tsx with /inspect project and summarize attachment handling.",
          id: "submitted-user-mixed",
          kind: "user-message",
          timestampLabel: "10:42 AM"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const SubmittedUserMessageAttachmentPreview: Story = {
  render: () => (
    <div className="flex min-h-screen items-start justify-center bg-background p-8 text-foreground">
      <div className="mt-12 max-w-md rounded-2xl bg-foreground p-4 text-background">
        <AttachmentTray
          attachments={[CHAT_BODY_ATTACHMENTS[0], LONG_MARKDOWN_ATTACHMENT]}
          compact
          initialPreviewAttachmentId="chat-header-reference"
        />
        <div className="text-sm">
          Review @chat-body.tsx with /inspect project and summarize attachment handling.
        </div>
      </div>
    </div>
  )
};

export const StreamingAssistantResponse: Story = {
  render: () => (
    <ChatBody
      composerRunStatus="running"
      items={[
        {
          content: "Please explain what the active composer is doing.",
          id: "streaming-user",
          kind: "user-message",
          timestampLabel: "10:43 AM"
        },
        {
          content:
            "The composer has accepted the prompt and is streaming the assistant response into the transcript",
          id: "streaming-assistant",
          kind: "assistant-message",
          modelLabel: "GPT-5.5",
          thinkingLevelLabel: "medium"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onStopRun={() => undefined}
    />
  )
};

export const AssistantResponseErrorAndAborted: Story = {
  render: () => (
    <ChatBody
      items={[
        {
          content: "Try sending a request and then stop it midway.",
          id: "aborted-user",
          kind: "user-message",
          timestampLabel: "10:44 AM"
        },
        {
          content: "The request was stopped before Pi completed the response.",
          id: "aborted-assistant",
          kind: "assistant-message",
          modelLabel: "GPT-5.5",
          thinkingLevelLabel: "medium",
          timestampLabel: "10:44 AM"
        },
        {
          detail: "The runtime reported a mocked submit failure after preserving the draft.",
          id: "assistant-runtime-error",
          kind: "error",
          message: "The assistant response could not complete.",
          title: "Assistant response error"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const LongMessageWrapping: Story = {
  render: () => (
    <ChatBody items={LONG_MESSAGE_ITEMS} metrics={CHAT_BODY_DEFAULT_METRICS} />
  )
};

export const ToolActionsRunning: Story = {
  render: () => (
    <ChatBody items={TOOL_ACTION_RUNNING_ITEMS} metrics={CHAT_BODY_DEFAULT_METRICS} />
  )
};

export const ToolActionsCompleteAndError: Story = {
  render: () => (
    <ChatBody
      items={TOOL_ACTION_COMPLETE_ERROR_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const ToolActionsAllStatesAndTools: Story = {
  render: () => (
    <ChatBody
      items={[
        {
          commandLabel: "bash corepack pnpm typecheck",
          detail: "Running TypeScript verification.",
          id: "tool-bash-running",
          kind: "tool-action",
          status: "running",
          summary: "Typecheck in progress.",
          title: "Typecheck",
          toolName: "bash"
        },
        {
          commandLabel: "read src/shared/chat.ts",
          detail: "Loaded renderer-safe chat contract.",
          id: "tool-read-complete",
          kind: "tool-action",
          status: "complete",
          summary: "Read chat model.",
          title: "Read file",
          toolName: "read"
        },
        {
          commandLabel: "edit src/renderer/surfaces/chat-body.tsx",
          detail: "Applying visual composition edits.",
          id: "tool-edit-working",
          kind: "tool-action",
          status: "working",
          summary: "Edit in progress.",
          title: "Edit file",
          toolName: "edit"
        },
        {
          commandLabel: "write storybook fixtures",
          id: "tool-write-queued",
          kind: "tool-action",
          status: "queued",
          summary: "Waiting to write fixtures.",
          title: "Write fixtures",
          toolName: "write"
        },
        {
          commandLabel: "grep -n ChatBody src/renderer",
          detail: "Output intentionally truncated for layout review.",
          id: "tool-grep-truncated",
          kind: "tool-action",
          status: "complete",
          summary: "Search found multiple matches.",
          title: "Search usages",
          toolName: "grep",
          truncated: true
        },
        {
          commandLabel: "find src/renderer -name '*.stories.tsx'",
          detail: "Mocked failure while reading one generated path.",
          id: "tool-find-error",
          kind: "tool-action",
          status: "error",
          summary: "Find story files failed.",
          title: "Find stories",
          toolName: "find"
        },
        {
          commandLabel: "ls storybook-static",
          id: "tool-ls-cancelled",
          kind: "tool-action",
          status: "cancelled",
          summary: "Listing was cancelled by user.",
          title: "List build output",
          toolName: "ls"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const ThinkingCollapsedAndExpanded: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {THINKING_ITEMS.map((item) => (
          <ThinkingPanel item={item as ChatThinkingItem} key={item.id} />
        ))}
      </div>
    </div>
  )
};

export const ThinkingErrorState: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <ThinkingPanel
        item={{
          defaultOpen: true,
          detail: "The mocked planning stream encountered an unavailable model response.",
          id: "thinking-error",
          kind: "thinking",
          status: "error",
          summary: "Planning stream failed.",
          title: "Thinking"
        }}
      />
    </div>
  )
};

export const InlineCompactionRunning: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <CompactionNotice
        item={
          COMPACTION_NOTICE_ITEMS[0] as Extract<ChatItem, { kind: "compaction-notice" }>
        }
      />
    </div>
  )
};

export const InlineCompactionComplete: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <CompactionNotice
        item={
          COMPACTION_NOTICE_ITEMS[1] as Extract<ChatItem, { kind: "compaction-notice" }>
        }
      />
    </div>
  )
};

export const InlineCompactionError: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <CompactionNotice
        item={
          COMPACTION_NOTICE_ITEMS[2] as Extract<ChatItem, { kind: "compaction-notice" }>
        }
      />
    </div>
  )
};

export const InlineCompactionTranscriptStates: Story = {
  render: () => (
    <ChatBody
      items={COMPACTION_NOTICE_ITEMS as ChatCompactionNoticeItem[]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const CustomExtensionSurface: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <CustomSurfaceCard
        description="Custom extension surfaces use a renderer-safe fallback before specialized customType views are implemented."
        detailLines={[
          "Original task: build a two-agent chain",
          "Step 1: scout writes folders.md",
          "Step 2: planner writes summary.md"
        ]}
        status="running"
        title="Chain planner"
        type="chain-editor"
      />
    </div>
  )
};

export const CustomExtensionFallback: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <CustomSurfaceCard
        description="Unknown custom message types still render as readable fallback content."
        status="queued"
        title="Unsupported extension surface"
        type="unknown-custom-message"
      />
    </div>
  )
};

export const RuntimeEventNormalization: Story = {
  render: () => (
    <ChatBody
      items={replayRuntimeTranscriptSnapshot(RICH_RUNTIME_SNAPSHOT).items}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const VerificationSummary: Story = {
  render: () => (
    <ChatBody
      items={VERIFICATION_SUMMARY_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const GithubAutomationReady: Story = {
  name: "GitHub Automation Ready",
  render: () => (
    <ChatBody
      items={GITHUB_AUTOMATION_READY_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const GithubAutomationErrorStates: Story = {
  name: "GitHub Automation Error States",
  render: () => (
    <ChatBody
      items={GITHUB_AUTOMATION_ERROR_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const ToolApprovalRequest: Story = {
  name: "Tool Approval Request",
  render: () => (
    <ChatBody
      items={TOOL_APPROVAL_REQUEST_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const ToolApprovalBlocked: Story = {
  name: "Tool Approval Blocked",
  render: () => (
    <ChatBody
      items={TOOL_APPROVAL_BLOCKED_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const ChangeSummary: Story = {
  name: "Change Summary",
  render: () => (
    <ChatBody
      items={CHANGE_SUMMARY_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onExternalFileOpen={openRuntime7FileExternally}
    />
  )
};

export const ChangeReviewDiff: Story = {
  name: "Change Review Diff",
  render: () => (
    <ChatBody
      items={CHANGE_REVIEW_DIFF_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onExternalFileOpen={openRuntime7FileExternally}
    />
  )
};

export const CheckpointUndoConfirmation: Story = {
  name: "Checkpoint Undo Confirmation",
  render: () => (
    <ChatBody
      items={CHECKPOINT_UNDO_CONFIRMATION_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onExternalFileOpen={openRuntime7FileExternally}
    />
  )
};

export const ChangeRecoveryStates: Story = {
  name: "Change Recovery States",
  render: () => (
    <ChatBody
      items={CHANGE_RECOVERY_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onExternalFileOpen={openRuntime7FileExternally}
    />
  )
};

export const BackgroundTaskStatus: Story = {
  name: "Background Task Status",
  render: () => (
    <ChatBody
      items={BACKGROUND_TASK_STATUS_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const OperatorRunLifecycle: Story = {
  name: "Operator Run Lifecycle",
  render: () => (
    <ChatBody
      items={OPERATOR_RUN_LIFECYCLE_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const SubagentChain: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <SubagentChainSurface item={SUBAGENT_CHAIN_RUNNING_ORCHESTRATION_ITEM} />
    </div>
  )
};

export const SubagentChainComplete: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <SubagentChainSurface
        item={{
          ...SUBAGENT_CHAIN_ITEMS[0],
          agents: SUBAGENT_CHAIN_ITEMS[0].kind === "subagent-chain"
            ? SUBAGENT_CHAIN_ITEMS[0].agents.map((agent) => ({
                ...agent,
                durationLabel: agent.durationLabel ?? "1.2s",
                status: "complete"
              }))
            : [],
          id: "subagent-chain-complete",
          kind: "subagent-chain",
          status: "complete",
          title: "subagent chain complete (2)"
        }}
      />
    </div>
  )
};

export const SubagentChainCompleteWithMergeSummary: Story = {
  render: () => (
    <ChatBody
      items={SUBAGENT_CHAIN_COMPLETE_WITH_MERGE_SUMMARY_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const SubagentChainErrorStates: Story = {
  render: () => (
    <ChatBody
      items={SUBAGENT_CHAIN_ERROR_STATE_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const SubagentChainRetryAvailable: Story = {
  render: () => (
    <ChatBody
      items={[SUBAGENT_CHAIN_RETRY_AVAILABLE_ITEM]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const TranscriptEventGroupsCollapsed: Story = {
  render: () => (
    <ChatBody
      items={[
        {
          commandLabel: "corepack pnpm storybook:build",
          defaultOpen: false,
          detail: "Storybook completed with the existing chunk-size warning.",
          id: "collapsed-tool",
          kind: "tool-action",
          status: "complete",
          summary: "Storybook build completed.",
          title: "Build Storybook",
          toolName: "bash"
        },
        {
          defaultOpen: false,
          detail:
            "Collapsed thinking keeps the status visible and lets keyboard users expand details.",
          id: "collapsed-thinking",
          kind: "thinking",
          status: "complete",
          summary: "Thinking detail is collapsed by default.",
          title: "Thinking"
        },
        {
          ...(SUBAGENT_CHAIN_ITEMS[0] as Extract<ChatItem, { kind: "subagent-chain" }>),
          defaultOpen: false,
          status: "complete"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const TranscriptKeyboardExpandableRows: Story = {
  render: () => (
    <ChatBody
      items={[
        {
          commandLabel: "corepack pnpm storybook:build",
          defaultOpen: false,
          detail:
            "Keyboard focus should reveal a visible ring and the row can be expanded without relying on hover.",
          id: "keyboard-tool-row",
          kind: "tool-action",
          status: "complete",
          summary: "Collapsed tool row with visible focus treatment.",
          title: "Build Storybook",
          toolName: "bash"
        },
        {
          defaultOpen: false,
          detail:
            "The thinking row uses the same trigger affordance as tools and subagent rows.",
          id: "keyboard-thinking-row",
          kind: "thinking",
          status: "complete",
          summary: "Collapsed thinking row with keyboard affordance.",
          title: "Thinking"
        },
        {
          ...(SUBAGENT_CHAIN_ITEMS[0] as Extract<ChatItem, { kind: "subagent-chain" }>),
          defaultOpen: false,
          id: "keyboard-subagent-row"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const TranscriptMetadataVariants: Story = {
  render: () => (
    <ChatBody
      items={[
        {
          content: "Give me a runtime transcript metadata pass.",
          id: "metadata-user",
          kind: "user-message",
          timestampLabel: "11:10 AM"
        },
        {
          content: "Assistant metadata uses the same compact model, thinking, cost, and time pattern.",
          costLabel: "$0.03",
          id: "metadata-assistant",
          kind: "assistant-message",
          modelLabel: "GPT-5.5",
          thinkingLevelLabel: "medium",
          timestampLabel: "11:11 AM"
        },
        {
          commandLabel: "corepack pnpm typecheck",
          costLabel: "$0.01",
          detail: "Typecheck passed.",
          id: "metadata-tool-complete",
          kind: "tool-action",
          status: "complete",
          summary: "TypeScript verification completed.",
          title: "Typecheck",
          toolName: "bash"
        },
        {
          ...(SUBAGENT_CHAIN_ITEMS[0] as Extract<ChatItem, { kind: "subagent-chain" }>),
          agents:
            (SUBAGENT_CHAIN_ITEMS[0] as Extract<ChatItem, { kind: "subagent-chain" }>).agents.map(
              (agent) => ({
                ...agent,
                durationLabel: agent.durationLabel ?? "1.4s",
                status: agent.id === "subagent-planner" ? "running" : "complete"
              })
            ),
          id: "metadata-subagent-running",
          status: "running"
        },
        {
          ...(SUBAGENT_CHAIN_ITEMS[0] as Extract<ChatItem, { kind: "subagent-chain" }>),
          agents:
            (SUBAGENT_CHAIN_ITEMS[0] as Extract<ChatItem, { kind: "subagent-chain" }>).agents.map(
              (agent) => ({
                ...agent,
                durationLabel: agent.durationLabel ?? "1.4s",
                status: "complete"
              })
            ),
          id: "metadata-subagent-complete",
          status: "complete",
          title: "subagent chain complete (2)"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const TranscriptRecoveryStates: Story = {
  render: () => (
    <ChatBody items={TRANSCRIPT_RECOVERY_ITEMS} metrics={CHAT_BODY_DEFAULT_METRICS} />
  )
};

export const DenseTranscriptNarrowViewport: Story = {
  render: () => (
    <div className="mx-auto h-screen w-[430px] overflow-hidden border-x bg-background text-foreground">
      <ChatBody
        chatTitle="Release readiness review"
        items={DENSE_TRANSCRIPT_ITEMS}
        metrics={{
          ...CHAT_BODY_DEFAULT_METRICS,
          contextPercent: 91,
          cost: 18.42
        }}
      />
    </div>
  )
};

export const ComposerNoAttachments: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer />
    </div>
  )
};

export const ComposerSingleImageAttachment: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer attachments={[CHAT_BODY_ATTACHMENTS[0]]} />
    </div>
  )
};

export const ComposerMultipleFileAttachments: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer
        attachments={[
          { ...CHAT_BODY_ATTACHMENTS[1], id: "session-plan-copy" },
          {
            description: "Renderer event notes",
            id: "events-md",
            kind: "file",
            mimeType: "text/markdown",
            name: "events.md",
            previewState: "available",
            previewText: "# Events\n\n- Runtime connected\n- Session restored\n- Composer ready",
            source: "project-file",
            uploadStatus: "complete",
            sizeLabel: "9 KB"
          }
        ]}
      />
    </div>
  )
};

export const ComposerLongFilenameAttachment: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer attachments={[LONG_MARKDOWN_ATTACHMENT]} />
    </div>
  )
};

export const ComposerLongFilenameAttachmentsWrap: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer
        attachments={[
          LONG_MARKDOWN_ATTACHMENT,
          {
            ...LONG_MARKDOWN_ATTACHMENT,
            id: "renderer-session-state-diagnostics-copy",
            name: "renderer-session-state-diagnostics-export-for-review-thread.md",
            sizeLabel: "24 KB"
          },
          {
            description: "Event stream debug notes",
            id: "event-stream-debugging",
            kind: "file",
            mimeType: "text/markdown",
            name: "event-stream-debugging-notes-with-subagent-runtime-output.md",
            sizeLabel: "31 KB"
          }
        ]}
      />
    </div>
  )
};

export const ComposerAttachments: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer attachments={CHAT_BODY_ATTACHMENTS} />
    </div>
  )
};

export const ComposerAttachmentPreviewOpen: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <div className="w-full max-w-3xl rounded-xl border bg-muted/72 p-3">
        <AttachmentTray
          attachments={CHAT_BODY_ATTACHMENTS}
          initialPreviewAttachmentId="chat-header-reference"
        />
      </div>
    </div>
  )
};

export const ComposerFilePreviewUnsupported: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <div className="w-full max-w-3xl rounded-xl border bg-muted/72 p-3">
        <AttachmentTray
          attachments={[UNSUPPORTED_PREVIEW_ATTACHMENT]}
          initialPreviewAttachmentId="runtime-archive-unsupported"
        />
      </div>
    </div>
  )
};

export const ComposerTextCodePreviewOpen: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <div className="w-full max-w-3xl rounded-xl border bg-muted/72 p-3">
        <AttachmentTray
          attachments={[CODE_PREVIEW_ATTACHMENT]}
          initialPreviewAttachmentId="chat-body-code-preview"
        />
      </div>
    </div>
  )
};

export const ComposerUnknownFilePreviewOpen: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <div className="w-full max-w-3xl rounded-xl border bg-muted/72 p-3">
        <AttachmentTray
          attachments={[UNKNOWN_PREVIEW_ATTACHMENT]}
          initialPreviewAttachmentId="renderer-cache-unknown"
        />
      </div>
    </div>
  )
};

export const ComposerAttachmentUploadProgress: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer attachments={[UPLOADING_ATTACHMENT, CHAT_BODY_ATTACHMENTS[1]]} />
    </div>
  )
};

export const ComposerAttachmentUploadError: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer attachments={[ERROR_ATTACHMENT, CHAT_BODY_ATTACHMENTS[0]]} />
    </div>
  )
};

export const ComposerDragDropReady: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer dragState="drag-over" />
    </div>
  )
};

export const ComposerDragDropUnsupported: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer dragState="unsupported" />
    </div>
  )
};

export const ComposerFilePickerEmpty: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer />
    </div>
  )
};

export const ComposerSelectedTokens: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer
        selectedTokens={[
          { id: "selected-command", kind: "command", label: "inspect project" },
          { id: "selected-mention", kind: "mention", label: "app-frame.tsx" }
        ]}
      />
    </div>
  )
};

export const ComposerMixedAttachmentsAndTokens: Story = {
  render: () => (
    <div className="flex min-h-screen items-center bg-background p-8 text-foreground">
      <ChatComposer
        attachments={[CHAT_BODY_ATTACHMENTS[0], LONG_MARKDOWN_ATTACHMENT]}
        selectedTokens={[
          { id: "selected-command", kind: "command", label: "inspect project" },
          { id: "selected-mention", kind: "mention", label: "chat-body.tsx" }
        ]}
      />
    </div>
  )
};

export const ComposerAttachmentsWithSlashPicker: Story = {
  render: () => (
    <div className="flex min-h-screen items-end justify-center bg-background p-8 text-foreground">
      <ChatComposer
        attachments={CHAT_BODY_ATTACHMENTS}
        commands={CHAT_BODY_COMMANDS}
        mode="slash"
        selectedTokens={[
          { id: "attachment-command", kind: "command", label: "inspect project" }
        ]}
      />
    </div>
  )
};

export const ComposerAttachmentsWithMentionPicker: Story = {
  render: () => (
    <div className="flex min-h-screen items-end justify-center bg-background p-8 text-foreground">
      <ChatComposer
        attachments={CHAT_BODY_ATTACHMENTS}
        mentions={CHAT_BODY_MENTIONS}
        mode="mention"
        selectedTokens={[
          { id: "attachment-mention", kind: "mention", label: "chat-body.tsx" }
        ]}
      />
    </div>
  )
};

export const SlashCommandPickerOpen: Story = {
  render: () => (
    <div className="flex min-h-screen items-end justify-center bg-background p-8 text-foreground">
      <ChatComposer
        commands={CHAT_BODY_COMMANDS}
        mode="slash"
        selectedTokens={[
          { id: "token-command", kind: "command", label: "storybook review" }
        ]}
      />
    </div>
  )
};

export const MentionPickerOpen: Story = {
  render: () => (
    <div className="flex min-h-screen items-end justify-center bg-background p-8 text-foreground">
      <ChatComposer
        mentions={CHAT_BODY_MENTIONS}
        mode="mention"
        selectedTokens={[{ id: "token-mention", kind: "mention", label: "app-frame.tsx" }]}
      />
    </div>
  )
};

export const SlashCommandPickerNoResults: Story = {
  render: () => (
    <div className="flex min-h-screen items-end justify-center bg-background p-8 text-foreground">
      <ChatComposer commands={[]} mode="slash" />
    </div>
  )
};

export const MentionPickerNoResults: Story = {
  render: () => (
    <div className="flex min-h-screen items-end justify-center bg-background p-8 text-foreground">
      <ChatComposer mentions={[]} mode="mention" />
    </div>
  )
};

export const ActiveComposerEmpty: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      items={[]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const ActiveComposerReadyToSend: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      composerDraft="Summarize the current renderer session state."
      items={BASIC_CONVERSATION_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onComposerSubmit={() => undefined}
    />
  )
};

export const ActiveComposerSubmitting: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      composerDraft="Submit this and keep the draft if runtime rejects it."
      items={BASIC_CONVERSATION_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onComposerSubmit={() => ({
        accepted: false,
        errorMessage: "Mocked runtime rejection. Draft stays in place."
      })}
    />
  )
};

export const ActiveComposerSubmitError: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      composerDraft="Submit this and keep the draft if runtime rejects it."
      composerSubmitError="Runtime rejected the submit request. The draft is still available."
      items={BASIC_CONVERSATION_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const ActiveRunControlsRunning: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      composerDraft="Draft can remain visible while Pi is responding."
      composerRunStatus="running"
      items={[
        ...BASIC_CONVERSATION_ITEMS,
        {
          content: "Pi is currently streaming a response from runtime events",
          id: "active-run-streaming",
          kind: "assistant-message",
          modelLabel: "GPT-5.5",
          thinkingLevelLabel: "medium"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onStopRun={() => undefined}
    />
  )
};

export const ActiveRunControlsRunningNoDraft: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      composerRunStatus="running"
      items={[
        ...BASIC_CONVERSATION_ITEMS,
        {
          content: "Pi is currently streaming a response from runtime events",
          id: "active-run-streaming-no-draft",
          kind: "assistant-message",
          modelLabel: "GPT-5.5",
          thinkingLevelLabel: "medium"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onStopRun={() => undefined}
    />
  )
};

export const ActiveRunControlsStopping: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      composerDraft="Stopping disables the stop affordance until runtime responds."
      composerRunStatus="stopping"
      items={BASIC_CONVERSATION_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onStopRun={() => undefined}
    />
  )
};

export const ActiveRunControlsStopped: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      composerDraft="The stopped state returns the composer to normal submission."
      composerRunStatus="stopped"
      items={[
        ...BASIC_CONVERSATION_ITEMS,
        {
          detail: "The active run was stopped by the user.",
          id: "stopped-summary",
          kind: "error",
          message: "The active run was stopped.",
          title: "Run stopped"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onComposerSubmit={() => undefined}
    />
  )
};

export const ActiveComposerAttachments: Story = {
  render: () => (
    <ChatBody
      attachments={CHAT_BODY_ATTACHMENTS}
      chatTitle="Project setup"
      composerDraft="Review these files."
      items={BASIC_CONVERSATION_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onComposerSubmit={() => undefined}
    />
  )
};

export const ActiveComposerSelectedTokens: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      items={BASIC_CONVERSATION_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onComposerSubmit={() => undefined}
      selectedTokens={[
        { id: "active-token-file", kind: "mention", label: "chat-body.tsx" },
        { id: "active-token-command", kind: "command", label: "inspect project" }
      ]}
    />
  )
};

export const ActiveComposerSlashPicker: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      commands={CHAT_BODY_COMMANDS}
      composerMode="slash"
      items={BASIC_CONVERSATION_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      selectedTokens={[
        { id: "active-token-command", kind: "command", label: "storybook review" }
      ]}
    />
  )
};

export const ActiveComposerAttachmentsWithSlashPicker: Story = {
  render: () => (
    <ChatBody
      attachments={CHAT_BODY_ATTACHMENTS}
      chatTitle="Project setup"
      commands={CHAT_BODY_COMMANDS}
      composerMode="slash"
      items={BASIC_CONVERSATION_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      selectedTokens={[
        { id: "active-attachment-command", kind: "command", label: "inspect project" }
      ]}
    />
  )
};

export const ActiveComposerMentionPicker: Story = {
  render: () => (
    <ChatBody
      chatTitle="Project setup"
      composerMode="mention"
      items={BASIC_CONVERSATION_ITEMS}
      mentions={CHAT_BODY_MENTIONS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      selectedTokens={[
        { id: "active-token-mention", kind: "mention", label: "app-frame.tsx" }
      ]}
    />
  )
};

export const ActiveComposerAttachmentsWithMentionPicker: Story = {
  render: () => (
    <ChatBody
      attachments={CHAT_BODY_ATTACHMENTS}
      chatTitle="Project setup"
      composerMode="mention"
      items={BASIC_CONVERSATION_ITEMS}
      mentions={CHAT_BODY_MENTIONS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      selectedTokens={[
        { id: "active-attachment-mention", kind: "mention", label: "app-frame.tsx" }
      ]}
    />
  )
};

export const FullActiveSession: Story = {
  render: () => (
    <ChatBody
      attachments={CHAT_BODY_ATTACHMENTS}
      items={FULL_ACTIVE_CHAT_ITEMS}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      selectedTokens={[
        { id: "token-file", kind: "mention", label: "chat-body.tsx" },
        { id: "token-command", kind: "command", label: "inspect project" }
      ]}
    />
  )
};

export const MixedRuntimeTranscriptSequence: Story = {
  render: () => (
    <ChatBody
      composerDraft="Continue after the tool and subagent events finish."
      composerPlanMode
      composerRunStatus="running"
      items={[
        {
          content: "Please inspect the renderer and tell me what UI 10 should wire.",
          id: "runtime-sequence-user",
          kind: "user-message",
          timestampLabel: "10:45 AM"
        },
        TOOL_ACTION_RUNNING_ITEMS[0],
        THINKING_ITEMS[1],
        SUBAGENT_CHAIN_RUNNING_ORCHESTRATION_ITEM,
        {
          content:
            "I found the runtime path. Composer submission, streaming assistant output, tool events, and stop controls can all share the existing transcript rows.",
          id: "runtime-sequence-assistant",
          kind: "assistant-message",
          modelLabel: "GPT-5.5",
          thinkingLevelLabel: "medium"
        }
      ]}
      metrics={CHAT_BODY_DEFAULT_METRICS}
      onStopRun={() => undefined}
    />
  )
};

export const PickerComponents: Story = {
  render: () => (
    <div className="grid min-h-screen gap-6 bg-background p-8 text-foreground lg:grid-cols-2">
      <div>
        <div className="mb-3 font-medium text-sm">Slash commands</div>
        <div className="rounded-2xl border bg-popover p-1 shadow-lg/5">
          <SlashCommandPickerPreview commands={CHAT_BODY_COMMANDS} />
        </div>
      </div>
      <div>
        <div className="mb-3 font-medium text-sm">Mentions</div>
        <div className="rounded-2xl border bg-popover p-1 shadow-lg/5">
          <MentionPickerPreview mentions={CHAT_BODY_MENTIONS} />
        </div>
      </div>
    </div>
  )
};

export const StatusAndIconParticles: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-medium text-sm">Run status badges</h2>
          <div className="mt-3">
            <ChatStatusLegend />
          </div>
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-medium text-sm">Chat body icon particles</h2>
          <div className="mt-3">
            <ChatIconLegend />
          </div>
        </section>
      </div>
    </div>
  )
};

export const ToolActionParticle: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <ToolActionFrame
        item={{
          commandLabel: "bash corepack pnpm storybook:build",
          detail: "Static Storybook particle for action row review.",
          id: "tool-particle",
          kind: "tool-action",
          status: "complete",
          summary: "Storybook build completed.",
          title: "Build Storybook",
          toolName: "bash"
        }}
      />
    </div>
  )
};
