import type { Meta, StoryObj } from "@storybook/react-vite";
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
import { normalizeRuntimeTranscriptEvents } from "@shared/chat";

const meta = {
  title: "Surfaces/Chat Body",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

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
      items={normalizeRuntimeTranscriptEvents(RICH_RUNTIME_EVENTS)}
      metrics={CHAT_BODY_DEFAULT_METRICS}
    />
  )
};

export const SubagentChain: Story = {
  render: () => (
    <div className="min-h-screen bg-background p-8 text-foreground">
      <SubagentChainSurface
        item={SUBAGENT_CHAIN_ITEMS[0] as Extract<ChatItem, { kind: "subagent-chain" }>}
      />
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
        SUBAGENT_CHAIN_ITEMS[0],
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
