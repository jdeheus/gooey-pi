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
  ChatThinkingItem
} from "@shared/chat";

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
  sizeLabel: "18 KB"
};

export const HeaderMetrics: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics metrics={CHAT_BODY_DEFAULT_METRICS} />
    </div>
  )
};

export const HeaderMetricsHighContext: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        metrics={{ ...CHAT_BODY_DEFAULT_METRICS, contextPercent: 92, cost: 12.9876 }}
      />
    </div>
  )
};

export const HeaderMetricsCompacting: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        metrics={{ ...CHAT_BODY_DEFAULT_METRICS, contextPercent: 78, isCompacting: true }}
      />
    </div>
  )
};

export const HeaderMetricsUnavailable: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        metrics={{ ...CHAT_BODY_DEFAULT_METRICS, contextPercent: 0, isUnavailable: true }}
      />
    </div>
  )
};

export const HeaderMetricsManyCompactions: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ChatHeaderMetrics
        metrics={{
          ...CHAT_BODY_DEFAULT_METRICS,
          compactions: [
            ...(CHAT_BODY_DEFAULT_METRICS.compactions ?? []),
            {
              id: "second-compaction",
              providerCosts: [
                { cost: 1.62, provider: "Anthropic" },
                { cost: 1.21, provider: "OpenAI" },
                { cost: 0.42, provider: "Local" }
              ],
              timestampLabel: "Yesterday",
              title: "Second compaction"
            },
            {
              id: "third-compaction",
              providerCosts: [
                { cost: 0.86, provider: "OpenAI" },
                { cost: 0.37, provider: "Local" },
                { cost: 0.22, provider: "Anthropic" }
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
