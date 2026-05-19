import {
  ArrowUpIcon,
  BrainCogIcon,
  BracesIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDotIcon,
  ClockIcon,
  CopyIcon,
  DollarSignIcon,
  ExternalLinkIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  GitBranchIcon,
  ImageIcon,
  LinkIcon,
  MessagesSquareIcon,
  PaperclipIcon,
  PanelLeftCloseIcon,
  ScissorsIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
  XIcon
} from "lucide-react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode
} from "react";
import { Badge, type BadgeProps } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger
} from "@renderer/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandShortcut
} from "@renderer/components/ui/command";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle
} from "@renderer/components/ui/frame";
import { Group, GroupSeparator, GroupText } from "@renderer/components/ui/group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea
} from "@renderer/components/ui/input-group";
import { Kbd, KbdGroup } from "@renderer/components/ui/kbd";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger
} from "@renderer/components/ui/menu";
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger
} from "@renderer/components/ui/preview-card";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle
} from "@renderer/components/ui/dialog";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { Separator } from "@renderer/components/ui/separator";
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle
} from "@renderer/components/ui/sheet";
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger
} from "@renderer/components/ui/tooltip";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@renderer/components/ui/toggle-group";
import { cn } from "@renderer/lib/utils";
import type {
  ChatAttachment,
  ChatCommandOption,
  ChatCompactionNoticeItem,
  ChatCompactionCostEntry,
  ChatItem,
  ChatMentionOption,
  ChatMessageItem,
  ChatProviderCost,
  ChatRecoveryItem,
  ChatRunStatus,
  ChatSessionMetrics,
  ChatSubagent,
  ChatSubagentActivity,
  ChatThinkingItem,
  ChatToken,
  ChatToolActionItem
} from "@shared/chat";
import type { RestoreChangeCheckpointResult } from "@shared/change-review";
import type {
  ToolApprovalDecision,
  ToolApprovalRequest,
  ToolApprovalResponseRequest,
  ToolApprovalResponseResult,
  ToolPermissionRisk
} from "@shared/tool-approvals";
import type {
  VerificationCheckStatus,
  VerificationPipelineStatus
} from "@shared/github-automation";
import { createMentionOptionsFromContextIndex } from "@shared/context-index";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

export interface ChatBodyProps {
  attachments?: ChatAttachment[];
  chatTitle?: string;
  commands?: ChatCommandOption[];
  composerDraft?: string;
  composerMode?: "default" | "mention" | "slash";
  composerPlanMode?: boolean;
  composerRunStatus?: ChatComposerRunStatus;
  composerSubmitError?: string;
  items: ChatItem[];
  mentions?: ChatMentionOption[];
  metrics: ChatSessionMetrics;
  onChatTitleRename?: (name: string) => void;
  onCompact?: () => void;
  onComposerSubmit?: (
    payload: ChatComposerSubmitPayload
  ) => ChatComposerSubmitResult | Promise<ChatComposerSubmitResult | void> | void;
  onExternalFileOpen?: (path: string) => Promise<void> | void;
  onStopRun?: () => Promise<void> | void;
  onToggleSidebar?: () => void;
  onToolApprovalRecovery?: (blockedId: string, actionId: string) => Promise<void> | void;
  onToolApprovalRespond?: (
    request: ToolApprovalResponseRequest
  ) => Promise<ToolApprovalResponseResult | void> | ToolApprovalResponseResult | void;
  onCheckpointRestore?: (
    checkpointId: string
  ) => Promise<RestoreChangeCheckpointResult | void> | RestoreChangeCheckpointResult | void;
  selectedTokens?: ChatToken[];
}

export interface ChatComposerSubmitPayload {
  attachments: ChatAttachment[];
  intent?: "queue" | "send" | "steer";
  planMode: boolean;
  selectedTokens: ChatToken[];
  text: string;
}

export interface ChatComposerSubmitResult {
  accepted: boolean;
  errorMessage?: string;
}

export type ChatComposerRunStatus =
  | "error"
  | "idle"
  | "running"
  | "stopped"
  | "stopping";

export function PlanModeBadge({
  className,
  onDismiss,
  size
}: {
  className?: string;
  onDismiss: () => void;
  size?: BadgeProps["size"];
}): ReactElement {
  return (
    <Badge className={cn("gap-1.5 pr-1", className)} size={size} variant="secondary">
      Plan mode
      <button
        aria-label="Dismiss plan mode badge"
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        onClick={onDismiss}
        type="button"
      >
        <XIcon aria-hidden="true" className="size-3" />
      </button>
    </Badge>
  );
}

export const CHAT_BODY_DEFAULT_METRICS: ChatSessionMetrics = {
  billingLabel: "sub",
  billingSources: ["subscription"],
  compactions: [
    {
      id: "current-compaction",
      providerCosts: [
        { cost: 3.21, provider: "OpenAI", tokens: 18_240 },
        { cost: 1.48, provider: "Anthropic", tokens: 8_400 },
        { cost: 0.74, provider: "Local", tokens: 4_200 }
      ],
      title: "Current compaction"
    },
    {
      id: "first-compaction",
      providerCosts: [
        { cost: 2.18, provider: "OpenAI", tokens: 12_600 },
        { cost: 0.96, provider: "Anthropic", tokens: 5_400 },
        { cost: 0.31, provider: "Local", tokens: 1_800 }
      ],
      timestampLabel: "10:14 AM",
      title: "First compaction"
    }
  ],
  contextPercent: 56,
  cost: 5.4346
};

export const CHAT_BODY_COMMANDS: ChatCommandOption[] = [
  {
    description: "Ask Pi to inspect the current project before responding.",
    id: "inspect-project",
    name: "Inspect project",
    shortcut: "/inspect",
    source: "builtin"
  },
  {
    description: "Run the Storybook verification checklist for this UI slice.",
    id: "storybook-review",
    name: "Storybook review",
    shortcut: "/storybook",
    source: "prompt"
  },
  {
    description: "Invoke an installed skill with renderer-safe mocked context.",
    id: "use-skill",
    name: "Use skill",
    shortcut: "/skill",
    source: "skill"
  },
  {
    description: "Open the extension handoff surface for a custom workflow.",
    id: "extension-handoff",
    name: "Extension handoff",
    shortcut: "/extension",
    source: "extension"
  }
];

export const CHAT_BODY_MENTIONS: ChatMentionOption[] = [
  ...createMentionOptionsFromContextIndex({
    readableFiles: [
      {
        id: "context-file-app-frame",
        kind: "source",
        language: "tsx",
        lineCount: 1420,
        projectRelativePath: "src/renderer/surfaces/app-frame.tsx",
        sizeBytes: 58300
      },
      {
        id: "context-file-chat-body",
        kind: "source",
        language: "tsx",
        lineCount: 2640,
        projectRelativePath: "src/renderer/surfaces/chat-body.tsx",
        sizeBytes: 114200
      },
      {
        id: "context-file-chat-stories",
        kind: "story",
        language: "tsx",
        lineCount: 1780,
        projectRelativePath: "src/renderer/chat-body.stories.tsx",
        sizeBytes: 70400
      }
    ]
  }),
  {
    description: "Coss implementation guidance",
    id: "coss-skill",
    kind: "skill",
    label: "coss",
    path: ".agents/skills/coss/SKILL.md"
  },
  {
    description: "Current renderer state fixture",
    id: "session-state",
    kind: "resource",
    label: "session state",
    path: "mock://renderer/session"
  }
];

const CHAT_HEADER_PREVIEW_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%23f4f4f5'/%3E%3Cpath d='M10 44 25 28l10 10 7-7 12 13H10Z' fill='%23d4d4d8'/%3E%3Ccircle cx='45' cy='20' r='6' fill='%23a1a1aa'/%3E%3C/svg%3E";

export const CHAT_BODY_ATTACHMENTS: ChatAttachment[] = [
  {
    description: "Visual reference",
    id: "chat-header-reference",
    kind: "image",
    name: "chat-header.png",
    previewState: "available",
    previewUrl: CHAT_HEADER_PREVIEW_URL,
    sizeLabel: "412 KB",
    source: "local-file",
    uploadStatus: "complete"
  },
  {
    description: "Implementation notes",
    id: "session-plan",
    kind: "file",
    mimeType: "text/markdown",
    name: "session-plan.md",
    previewState: "available",
    previewText:
      "# Session plan\n\n- Inspect the active renderer shell.\n- Verify attachment behavior in Storybook.\n- Keep file context renderer-safe and mocked.",
    sizeLabel: "18 KB",
    source: "project-file",
    uploadStatus: "complete"
  }
];

export const BASIC_CONVERSATION_ITEMS: ChatItem[] = [
  {
    content: "Can you review the renderer shell and list the UI states we still need?",
    id: "user-basic-1",
    kind: "user-message",
    timestampLabel: "10:31 AM"
  },
  {
    content:
      "Yes. The visible gap is the active chat body: header metrics, transcript rows, tool states, and composer attachment handling.",
    costLabel: "$0.02",
    id: "assistant-basic-1",
    kind: "assistant-message",
    modelLabel: "GPT-5.5",
    providerLabel: "OpenAI",
    thinkingLevelLabel: "medium",
    timestampLabel: "10:31 AM"
  }
];

export const LONG_MESSAGE_ITEMS: ChatItem[] = [
  {
    content:
      "I want this to handle long project paths, command output, and paragraphs without overflowing the transcript column or causing the composer to jump around on smaller screens.",
    id: "user-long-1",
    kind: "user-message"
  },
  {
    content:
      "The row keeps a fixed readable measure, wraps long text, and reserves metadata for compact labels instead of pushing the body wider. Inline file paths such as src/renderer/surfaces/chat-body.tsx wrap naturally.",
    id: "assistant-long-1",
    kind: "assistant-message"
  }
];

export const TOOL_ACTION_RUNNING_ITEMS: ChatItem[] = [
  ...BASIC_CONVERSATION_ITEMS,
  {
    commandLabel: "corepack pnpm typecheck",
    detail: "Checking renderer and shared TypeScript boundaries...",
    id: "tool-running-1",
    kind: "tool-action",
    status: "running",
    summary: "Typecheck is running against renderer-safe chat fixtures.",
    title: "Typecheck",
    toolName: "bash"
  },
  {
    detail:
      "Reviewing how the chat body should compose Coss Frame, Group, Command, and InputGroup primitives.",
    id: "thinking-running-1",
    kind: "thinking",
    status: "working",
    summary: "Mapping transcript surfaces to reusable renderer primitives.",
    title: "Thinking"
  }
];

export const TOOL_ACTION_COMPLETE_ERROR_ITEMS: ChatItem[] = [
  {
    commandLabel: "rg --files src/renderer",
    detail: "34 renderer files indexed",
    id: "tool-complete-1",
    kind: "tool-action",
    status: "complete",
    summary: "Renderer file inventory completed.",
    title: "List renderer files",
    toolName: "find"
  },
  {
    commandLabel: "storybook build",
    detail: "Mocked failure: missing fixture for custom chain surface.",
    id: "tool-error-1",
    kind: "tool-action",
    status: "error",
    summary: "Storybook build reported a fixture error.",
    title: "Build Storybook",
    toolName: "bash"
  },
  {
    content:
      "I found the missing fixture and isolated it to the new custom extension surface story.",
    id: "assistant-tools-1",
    kind: "assistant-message"
  }
];

export const THINKING_ITEMS: ChatItem[] = [
  {
    defaultOpen: false,
    detail:
      "The header can stay persistent while transcript rows stream underneath it. Compacting should be an explicit event from the right-side Group button.",
    id: "thinking-collapsed",
    kind: "thinking",
    status: "complete",
    summary: "Chat header and compaction controls can stay visually separate.",
    title: "Thinking"
  },
  {
    defaultOpen: true,
    detail:
      "The tool rows need to describe the action name, target, status, and optional truncated detail. They should not look like messages because they are execution telemetry.",
    id: "thinking-expanded",
    kind: "thinking",
    status: "working",
    summary: "Tool rows need their own execution treatment.",
    title: "Working"
  }
];

export const CUSTOM_EXTENSION_ITEMS: ChatItem[] = [
  {
    customType: "chain-editor",
    description:
      "Custom extension surfaces render through a constrained fallback while dedicated UI can be added later by customType.",
    detailLines: [
      "Chain: scout -> planner",
      "Reads: disabled",
      "Writes: folders.md, summary.md"
    ],
    id: "custom-chain",
    kind: "custom-surface",
    status: "running",
    title: "Chain planner"
  }
];

export const SUBAGENT_CHAIN_ITEMS: ChatItem[] = [
  {
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
        id: "subagent-planner",
        model: "gpt-5.5",
        name: "planner",
        role: "Create summary",
        status: "running",
        toolsLabel: "pending"
      }
    ],
    id: "subagent-chain",
    kind: "subagent-chain",
    status: "running",
    summary: "Subagents can show staged progress without needing a terminal-like surface.",
    title: "subagent chain (2)"
  }
];

export const COMPACTION_NOTICE_ITEMS: ChatItem[] = [
  {
    detail: "Older transcript context is being summarized before the session continues.",
    id: "compaction-notice-running",
    kind: "compaction-notice",
    status: "running",
    summary: "Preparing a compacted context snapshot.",
    title: "Compacting context"
  },
  {
    detail: "The compacted snapshot is now part of the active context.",
    id: "compaction-notice-complete",
    kind: "compaction-notice",
    status: "complete",
    summary: "Context compacted successfully.",
    title: "Context compacted"
  },
  {
    detail: "The full transcript is still available, but the compacted snapshot was not created.",
    id: "compaction-notice-error",
    kind: "compaction-notice",
    status: "error",
    summary: "Context compaction could not finish.",
    title: "Compaction failed"
  }
];

export const FULL_ACTIVE_CHAT_ITEMS: ChatItem[] = [
  {
    attachments: [CHAT_BODY_ATTACHMENTS[0]],
    content:
      "Please identify the active chat surface and keep the cost to two decimals.",
    id: "full-user-1",
    kind: "user-message",
    timestampLabel: "10:34 AM"
  },
  {
    commandLabel: "read src/renderer/surfaces/app-frame.tsx",
    detail: "Loaded app frame and interaction story references.",
    id: "full-tool-1",
    kind: "tool-action",
    status: "complete",
    summary: "Read renderer shell implementation.",
    title: "Read app frame",
    toolName: "read"
  },
  {
    defaultOpen: true,
    detail:
      "The chat body needs transcript rows, a compact header, and a composer that can display attachments, slash commands, and mentions without requiring live Pi runtime data.",
    id: "full-thinking-1",
    kind: "thinking",
    status: "complete",
    summary: "Separating renderer display from Pi runtime events.",
    title: "Thinking"
  },
  COMPACTION_NOTICE_ITEMS[1],
  ...SUBAGENT_CHAIN_ITEMS,
  {
    content:
      "The first implementation slice now covers the active chat structure with mocked data only. Runtime wiring can adapt Pi events into this shared chat contract later.",
    costLabel: "$0.04",
    id: "full-assistant-1",
    kind: "assistant-message",
    timestampLabel: "10:35 AM"
  }
];

export function ChatBody({
  attachments = [],
  chatTitle,
  commands = CHAT_BODY_COMMANDS,
  composerDraft,
  composerMode = "default",
  composerPlanMode = false,
  composerRunStatus = "idle",
  composerSubmitError,
  items,
  mentions = CHAT_BODY_MENTIONS,
  metrics,
  onChatTitleRename,
  onCompact,
  onComposerSubmit,
  onExternalFileOpen,
  onStopRun,
  onToggleSidebar,
  onCheckpointRestore,
  onToolApprovalRecovery,
  onToolApprovalRespond,
  selectedTokens = []
}: ChatBodyProps): ReactElement {
  const respondToToolApproval =
    onToolApprovalRespond ??
    ((request: ToolApprovalResponseRequest) =>
      window.gooeyPi?.respondToToolApproval(request) ?? {
        errorMessage: "The approval bridge is unavailable.",
        ok: false
      });
  const restoreCheckpoint =
    onCheckpointRestore ??
    ((checkpointId: string) =>
      window.gooeyPi?.restoreChangeCheckpoint({ checkpointId }) ?? {
        errorMessage: "The checkpoint bridge is unavailable.",
        restoredFiles: [],
        status: "failed" as const
      });
  const openExternalFile =
    onExternalFileOpen ??
    ((path: string) => {
      void window.gooeyPi?.openChangeDiff(path);
    });

  return (
    <section className="flex h-dvh max-h-dvh min-h-0 w-full max-w-full flex-col overflow-hidden bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle={chatTitle}
        metrics={metrics}
        onChatTitleRename={onChatTitleRename}
        onCompact={onCompact}
        onToggleSidebar={onToggleSidebar}
      />
      <ChatTranscript
        items={items}
        onCheckpointRestore={restoreCheckpoint}
        onExternalFileOpen={openExternalFile}
        onToolApprovalRecovery={onToolApprovalRecovery}
        onToolApprovalRespond={respondToToolApproval}
      />
      <div className="h-[9.5rem] shrink-0 bg-background px-6 pt-4 pb-8">
        <ChatComposer
          attachments={attachments}
          commands={commands}
          draft={composerDraft}
          mentions={mentions}
          mode={composerMode}
          onSubmit={onComposerSubmit}
          onStopRun={onStopRun}
          planMode={composerPlanMode}
          runStatus={composerRunStatus}
          selectedTokens={selectedTokens}
          submitErrorMessage={composerSubmitError}
        />
      </div>
    </section>
  );
}

export function ChatHeaderMetrics({
  chatTitle,
  initialRenamingTitle = false,
  metrics,
  onChatTitleRename,
  onCompact,
  onToggleSidebar
}: {
  chatTitle?: string;
  initialRenamingTitle?: boolean;
  metrics: ChatSessionMetrics;
  onChatTitleRename?: (name: string) => void;
  onCompact?: () => void;
  onToggleSidebar?: () => void;
}): ReactElement {
  const [isRenamingTitle, setIsRenamingTitle] = useState(initialRenamingTitle);
  const [titleDraft, setTitleDraft] = useState(chatTitle ?? "");
  const [titleError, setTitleError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRenamingTitle) {
      setTitleDraft(chatTitle ?? "");
      setTitleError(null);
    }
  }, [chatTitle, isRenamingTitle]);

  function startTitleRename(): void {
    if (!chatTitle || !onChatTitleRename) {
      return;
    }

    setTitleDraft(chatTitle);
    setTitleError(null);
    setIsRenamingTitle(true);
  }

  function cancelTitleRename(): void {
    setTitleDraft(chatTitle ?? "");
    setTitleError(null);
    setIsRenamingTitle(false);
  }

  function saveTitleRename(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const nextName = titleDraft.trim();

    if (!nextName) {
      setTitleError("Chat name is required.");
      return;
    }

    onChatTitleRename?.(nextName);
    setIsRenamingTitle(false);
  }

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 shadow-sm/5">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          aria-label="Toggle sidebar"
          onClick={onToggleSidebar}
          size="icon-sm"
          variant="ghost"
        >
          <PanelLeftCloseIcon aria-hidden="true" />
        </Button>
        {chatTitle && isRenamingTitle && onChatTitleRename ? (
          <form className="min-w-0 flex-1" onSubmit={saveTitleRename}>
            <InputGroup className="h-10 w-full max-w-md rounded-md">
              <InputGroupInput
                aria-label={`Rename ${chatTitle}`}
                autoFocus
                className="font-heading font-semibold text-base"
                onChange={(event) => {
                  setTitleDraft(event.currentTarget.value);
                  setTitleError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    cancelTitleRename();
                  }
                }}
                value={titleDraft}
              />
              <InputGroupAddon align="inline-end">
                <Button
                  aria-label="Clear chat name"
                  disabled={!titleDraft}
                  onClick={() => {
                    setTitleDraft("");
                    setTitleError(null);
                  }}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <XIcon aria-hidden="true" />
                </Button>
                <Button
                  aria-label="Save chat name"
                  disabled={!titleDraft.trim()}
                  size="icon-sm"
                  type="submit"
                  variant="ghost"
                >
                  <CheckIcon aria-hidden="true" />
                </Button>
              </InputGroupAddon>
            </InputGroup>
            {titleError && (
              <div className="mt-1 text-destructive text-xs">{titleError}</div>
            )}
          </form>
        ) : chatTitle ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  className={cn(
                    "min-w-0 rounded-md px-2 py-1 text-left font-heading font-semibold text-base outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    onChatTitleRename && "cursor-pointer hover:bg-accent"
                  )}
                  onClick={startTitleRename}
                  type="button"
                />
              }
            >
              <span className="block truncate">{chatTitle}</span>
            </TooltipTrigger>
            <TooltipPopup>{chatTitle}</TooltipPopup>
          </Tooltip>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <CostBreakdownHoverCard metrics={metrics} />
        <CompactContextGroup
          disabled={metrics.isUnavailable}
          isCompacting={metrics.isCompacting}
          onCompact={onCompact}
          percent={metrics.contextPercent}
        />
        {metrics.isUnavailable && <Badge variant="warning">Unavailable</Badge>}
      </div>
    </header>
  );
}

export function CostBreakdownHoverCard({
  metrics
}: {
  metrics: ChatSessionMetrics;
}): ReactElement {
  const compactions = metrics.compactions ?? [];
  const hasScrollableCompactions = compactions.length > 2;
  const [breakdownMode, setBreakdownMode] =
    useState<CompactionBreakdownMode>("cost");

  return (
    <PreviewCard>
      <PreviewCardTrigger
        render={
          <GroupText
            className="h-8 justify-center bg-background px-3 font-mono text-foreground"
            render={
              <button aria-label="Show cost breakdown" type="button" />
            }
          >
            {breakdownMode === "cost"
              ? formatSessionCost(metrics.cost, getSessionBillingLabel(metrics))
              : `${formatCompactTokenCount(getSessionTokenCount(metrics))} tok`}
          </GroupText>
        }
      />
      <PreviewCardPopup
        align="end"
        className={cn(
          "w-104 flex-col overflow-hidden p-0",
          hasScrollableCompactions ? "h-80" : "max-h-[28rem]"
        )}
        sideOffset={8}
      >
        <div className="shrink-0 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold text-sm">
              {breakdownMode === "cost" ? "Cost breakdown" : "Token breakdown"}
            </div>
            <ToggleGroup
              aria-label="Cost breakdown display mode"
              className="shrink-0"
              onValueChange={(value) => {
                const [nextMode] = value;

                if (nextMode) {
                  setBreakdownMode(nextMode as CompactionBreakdownMode);
                }
              }}
              size="sm"
              value={[breakdownMode]}
              variant="outline"
            >
              <Tooltip>
                <TooltipTrigger
                  render={
                    <ToggleGroupItem aria-label="Cost" value="cost">
                      <DollarSignIcon aria-hidden="true" />
                    </ToggleGroupItem>
                  }
                />
                <TooltipPopup>Cost</TooltipPopup>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <ToggleGroupItem aria-label="Tokens" value="tokens">
                      <BrainCogIcon aria-hidden="true" />
                    </ToggleGroupItem>
                  }
                />
                <TooltipPopup>Tokens</TooltipPopup>
              </Tooltip>
            </ToggleGroup>
          </div>
          <div className="mt-1 text-muted-foreground text-xs">
            {breakdownMode === "cost"
              ? "Ranked by provider spend within each compaction."
              : "Ranked by provider token usage within each compaction."}
          </div>
        </div>
        {compactions.length > 0 ? (
          hasScrollableCompactions ? (
            <>
              <Separator />
              <ScrollArea className="min-h-0 flex-1" scrollFade scrollbarGutter>
                <div className="flex flex-col gap-3 p-4 pt-0">
                  {compactions.map((compaction) => (
                    <CompactionCostSection
                      compaction={compaction}
                      key={compaction.id}
                      mode={breakdownMode}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex flex-col gap-3 p-4 pt-0">
              {compactions.map((compaction) => (
                <CompactionCostSection
                  compaction={compaction}
                  key={compaction.id}
                  mode={breakdownMode}
                />
              ))}
            </div>
          )
        ) : (
          <div className="mx-4 mb-4 rounded-lg border bg-muted/40 p-3 text-muted-foreground text-sm">
            No compaction cost details are available yet.
          </div>
        )}
      </PreviewCardPopup>
    </PreviewCard>
  );
}

type CompactionBreakdownMode = "cost" | "tokens";

function CompactionCostSection({
  compaction,
  mode
}: {
  compaction: ChatCompactionCostEntry;
  mode: CompactionBreakdownMode;
}): ReactElement {
  const [open, setOpen] = useState(true);
  const getMetricValue = (providerCost: ChatProviderCost): number =>
    mode === "cost" ? providerCost.cost : (providerCost.tokens ?? 0);
  const rankedCosts = [...compaction.providerCosts].sort(
    (a, b) => getMetricValue(b) - getMetricValue(a)
  );
  const maxValue = rankedCosts[0] ? getMetricValue(rankedCosts[0]) : 0;
  const totalValue = rankedCosts.reduce(
    (sum, providerCost) => sum + getMetricValue(providerCost),
    0
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <section>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 rounded-md py-1 text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background">
          <div className="flex min-w-0 items-center gap-2">
            {open ? (
              <ChevronDownIcon aria-hidden="true" className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
            )}
            <span className="truncate font-medium text-sm">{compaction.title}</span>
          </div>
          {compaction.timestampLabel && (
            <span className="shrink-0 text-muted-foreground text-xs">
              {compaction.timestampLabel}
            </span>
          )}
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <div className="space-y-2 py-2 pl-6">
            {rankedCosts.map((providerCost, index) => {
              const metricValue = getMetricValue(providerCost);
              const widthPercent = maxValue > 0 ? (metricValue / maxValue) * 100 : 0;
              const metricPercent =
                totalValue > 0 ? Math.round((metricValue / totalValue) * 100) : 0;

              return (
                <div className="space-y-1" key={providerCost.provider}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">{providerCost.provider}</span>
                    <span className="font-mono">
                      {mode === "cost"
                        ? formatSessionCost(providerCost.cost)
                        : `${formatTokenCount(providerCost.tokens ?? 0)} tok`}{" "}
                      / {metricPercent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", getProviderBarColor(index))}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsiblePanel>
      </section>
    </Collapsible>
  );
}
export function CompactContextGroup({
  isCompacting = false,
  disabled = false,
  onCompact,
  percent
}: {
  disabled?: boolean;
  isCompacting?: boolean;
  onCompact?: () => void;
  percent: number;
}): ReactElement {
  return (
    <Group aria-label="Context compaction controls">
      <GroupText className="h-8 min-w-14 justify-center bg-background px-3 font-mono text-foreground">
        {Math.round(percent)}%
      </GroupText>
      <GroupSeparator />
      <Button
        aria-label="Compact context"
        className="h-8 sm:h-8"
        disabled={disabled}
        loading={isCompacting}
        onClick={onCompact}
        size="icon-sm"
        variant="outline"
      >
        <ScissorsIcon aria-hidden="true" />
      </Button>
    </Group>
  );
}

export function ChatTranscript({
  items,
  onCheckpointRestore,
  onExternalFileOpen,
  onToolApprovalRecovery,
  onToolApprovalRespond
}: {
  items: ChatItem[];
  onCheckpointRestore?: (
    checkpointId: string
  ) => Promise<RestoreChangeCheckpointResult | void> | RestoreChangeCheckpointResult | void;
  onExternalFileOpen?: (path: string) => Promise<void> | void;
  onToolApprovalRecovery?: (blockedId: string, actionId: string) => Promise<void> | void;
  onToolApprovalRespond?: (
    request: ToolApprovalResponseRequest
  ) => Promise<ToolApprovalResponseResult | void> | ToolApprovalResponseResult | void;
}): ReactElement {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl min-w-0 flex-col gap-4">
        {items.map((item) => (
          <ChatItemRow
            item={item}
            key={item.id}
            onCheckpointRestore={onCheckpointRestore}
            onExternalFileOpen={onExternalFileOpen}
            onToolApprovalRecovery={onToolApprovalRecovery}
            onToolApprovalRespond={onToolApprovalRespond}
          />
        ))}
      </div>
    </div>
  );
}

function ChatItemRow({
  item,
  onCheckpointRestore,
  onExternalFileOpen,
  onToolApprovalRecovery,
  onToolApprovalRespond
}: {
  item: ChatItem;
  onCheckpointRestore?: (
    checkpointId: string
  ) => Promise<RestoreChangeCheckpointResult | void> | RestoreChangeCheckpointResult | void;
  onExternalFileOpen?: (path: string) => Promise<void> | void;
  onToolApprovalRecovery?: (blockedId: string, actionId: string) => Promise<void> | void;
  onToolApprovalRespond?: (
    request: ToolApprovalResponseRequest
  ) => Promise<ToolApprovalResponseResult | void> | ToolApprovalResponseResult | void;
}): ReactElement {
  switch (item.kind) {
    case "assistant-message":
    case "user-message":
      return <ChatBubble item={item} />;
    case "tool-action":
      return <ToolActionFrame item={item} />;
    case "thinking":
      return <ThinkingPanel item={item} />;
    case "compaction-notice":
      return <CompactionNotice item={item} />;
    case "custom-surface":
      return (
        <CustomSurfaceCard
          description={item.description}
          detailLines={item.detailLines}
          status={item.status}
          title={item.title}
          type={item.customType}
        />
      );
    case "subagent-chain":
      return <SubagentChainSurface item={item} />;
    case "summary":
      return <SummaryFrame item={item} />;
    case "error":
      return <ErrorFrame item={item} />;
    case "recovery":
      return <RecoveryFrame item={item} />;
    case "verification-summary":
      return <VerificationSummaryFrame item={item} />;
    case "github-automation-ready":
      return <GitHubAutomationReadyFrame item={item} />;
    case "github-automation-error":
      return <GitHubAutomationErrorFrame item={item} />;
    case "tool-approval-request":
      return <ToolApprovalRequestFrame item={item} onRespond={onToolApprovalRespond} />;
    case "tool-approval-blocked":
      return <ToolApprovalBlockedFrame item={item} onRecoveryAction={onToolApprovalRecovery} />;
    case "change-summary":
      return (
        <ChangeSummaryFrame
          item={item}
          onExternalFileOpen={onExternalFileOpen}
        />
      );
    case "change-review-diff":
      return <ChangeReviewDiffFrame item={item} onExternalFileOpen={onExternalFileOpen} />;
    case "checkpoint-undo-confirmation":
      return (
        <CheckpointUndoConfirmationFrame
          item={item}
          onExternalFileOpen={onExternalFileOpen}
          onRestore={onCheckpointRestore}
        />
      );
    case "change-recovery":
      return <ChangeRecoveryFrame item={item} onExternalFileOpen={onExternalFileOpen} />;
    case "operator-run":
      return <OperatorRunFrame item={item} />;
    case "background-task":
      return <BackgroundTaskFrame item={item} />;
    default:
      return assertNever(item);
  }
}

export function CompactionNotice({
  item
}: {
  item: ChatCompactionNoticeItem;
}): ReactElement {
  return (
    <div className="mx-auto flex w-full max-w-3xl items-center gap-3 text-muted-foreground text-xs">
      <Separator className="flex-1" />
      <span
        className={cn(
          "flex shrink-0 items-center gap-1.5",
          item.status === "error" && "text-destructive"
        )}
      >
        {item.status === "error" && (
          <CircleAlertIcon aria-hidden="true" className="size-3.5" />
        )}
        {item.detail ?? item.summary}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}

export function ChatBubble({ item }: { item: ChatMessageItem }): ReactElement {
  const isUser = item.kind === "user-message";
  const hasAssistantFooter = !isUser && hasChatMessageFooter(item);

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "group max-w-[min(720px,85%)]",
          isUser ? "" : "outline-none"
        )}
        tabIndex={hasAssistantFooter ? 0 : undefined}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-6 shadow-xs/5",
            hasAssistantFooter && "rounded-b-xl",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border bg-card text-card-foreground"
          )}
        >
          {item.attachments && item.attachments.length > 0 && (
            <AttachmentTray attachments={item.attachments} compact />
          )}
          <div className="whitespace-pre-wrap break-words">{item.content}</div>
          {isUser && (item.costLabel || item.timestampLabel) && (
            <div className="mt-2 flex items-center justify-end gap-2 text-primary-foreground/72 text-xs">
              {item.costLabel && <span>{item.costLabel}</span>}
              {item.timestampLabel && <span>{item.timestampLabel}</span>}
            </div>
          )}
        </div>
        {hasAssistantFooter && <ChatMessageHoverFooter item={item} />}
      </div>
    </div>
  );
}

function ChatMessageHoverFooter({ item }: { item: ChatMessageItem }): ReactElement {
  return (
    <FrameFooter className="mt-1 flex items-center justify-between gap-4 bg-transparent px-1 py-0 text-muted-foreground text-xs opacity-0 transition-none group-focus-within:opacity-100 group-hover:opacity-100">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
        {(item.modelLabel || item.thinkingLevelLabel) && (
          <span className="flex min-w-0 items-center gap-1">
            {item.modelLabel && (
              <span className="truncate text-foreground">{item.modelLabel}</span>
            )}
            {item.thinkingLevelLabel && (
              <span className="shrink-0 font-light text-muted-foreground">
                {item.thinkingLevelLabel}
              </span>
            )}
          </span>
        )}
        {item.costLabel && (
          <span className="font-mono text-muted-foreground">
            {item.costLabel}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button aria-label="Copy AI response" size="icon-xs" variant="ghost">
          <CopyIcon aria-hidden="true" />
        </Button>
        {item.timestampLabel && (
          <>
            <Separator className="h-4" orientation="vertical" />
            <span>{item.timestampLabel}</span>
          </>
        )}
      </div>
    </FrameFooter>
  );
}

function hasChatMessageFooter(item: ChatMessageItem): boolean {
  return Boolean(
    item.costLabel ||
      item.modelLabel ||
      item.thinkingLevelLabel ||
      item.timestampLabel
  );
}

export function ChatInformationalFrame({
  children,
  className,
  collapsible = Boolean(children),
  description,
  descriptionClassName,
  footer,
  headerClassName,
  icon,
  iconClassName,
  onOpenChange,
  open = false,
  right,
  title,
  titleClassName,
  tone = "default"
}: {
  children?: ReactNode;
  className?: string;
  collapsible?: boolean;
  description?: ReactNode;
  descriptionClassName?: string;
  footer?: ReactNode;
  headerClassName?: string;
  icon?: ReactNode;
  iconClassName?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  right?: ReactNode;
  title: ReactNode;
  titleClassName?: string;
  tone?: "danger" | "default" | "warning";
}): ReactElement {
  const canCollapse = collapsible && Boolean(children) && Boolean(onOpenChange);
  const hoverClassName = tone === "danger"
    ? "hover:bg-destructive/4"
    : tone === "warning"
      ? "hover:bg-warning/4"
      : "hover:bg-muted/36";

  const frame = (
    <Frame
      className={cn(
        "mx-auto w-full max-w-4xl",
        "[&>[data-slot=collapsible-panel]]:pb-2",
        "[&>[data-slot=frame-panel]:last-child]:mb-1",
        tone === "danger" && "border-destructive/32",
        tone === "warning" && "border-warning/32",
        className
      )}
    >
      <FrameHeader
        className={cn(
          "flex-row items-center justify-between gap-3 px-4 py-3",
          headerClassName
        )}
      >
        {canCollapse ? (
          <CollapsibleTrigger
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              hoverClassName
            )}
          >
            <ChatInformationalFrameHeading
              description={description}
              descriptionClassName={descriptionClassName}
              icon={icon}
              iconClassName={iconClassName}
              title={title}
              titleClassName={titleClassName}
            />
          </CollapsibleTrigger>
        ) : (
          <ChatInformationalFrameHeading
            description={description}
            descriptionClassName={descriptionClassName}
            icon={icon}
            iconClassName={iconClassName}
            title={title}
            titleClassName={titleClassName}
          />
        )}
        <div className="flex shrink-0 items-center gap-2">
          {right}
          {canCollapse && (
            <CollapsibleTrigger
              aria-label={open ? "Collapse row" : "Expand row"}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            >
              {open ? (
                <ChevronDownIcon aria-hidden="true" className="size-4" />
              ) : (
                <ChevronRightIcon aria-hidden="true" className="size-4" />
              )}
            </CollapsibleTrigger>
          )}
        </div>
      </FrameHeader>
      {children && (
        canCollapse ? <CollapsiblePanel>{children}</CollapsiblePanel> : children
      )}
      {footer}
    </Frame>
  );

  if (!canCollapse) {
    return frame;
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      {frame}
    </Collapsible>
  );
}

function ChatInformationalFrameHeading({
  description,
  descriptionClassName,
  icon,
  iconClassName,
  title,
  titleClassName
}: {
  description?: ReactNode;
  descriptionClassName?: string;
  icon?: ReactNode;
  iconClassName?: string;
  title: ReactNode;
  titleClassName?: string;
}): ReactElement {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {icon && (
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground",
            iconClassName
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <FrameTitle className={cn("truncate", titleClassName)}>{title}</FrameTitle>
        {description && (
          <FrameDescription className={cn("truncate text-xs", descriptionClassName)}>
            {description}
          </FrameDescription>
        )}
      </div>
    </div>
  );
}

export function ToolActionFrame({
  item
}: {
  item: ChatToolActionItem;
}): ReactElement {
  const hasDetails = Boolean(item.detail || item.path || item.truncated || item.costLabel);
  const [open, setOpen] = useState(item.defaultOpen ?? true);

  return (
    <ChatInformationalFrame
      collapsible={hasDetails}
      description={item.summary}
      icon={getToolIcon(item.toolName)}
      onOpenChange={setOpen}
      open={open}
      right={<StatusBadge status={item.status} />}
      title={(
        <>
          <span className="font-semibold text-foreground">{item.toolName}</span>
          <span className="ml-2 font-normal text-muted-foreground">
            {item.commandLabel ?? item.title}
          </span>
        </>
      )}
    >
      {hasDetails && (
        <FrameFooter className="flex items-center justify-between gap-3 px-4 py-3 text-muted-foreground text-xs">
          <div className="min-w-0 truncate">
            {item.path ?? item.detail}
            {item.truncated && <span className="ml-2">(truncated)</span>}
          </div>
          {item.costLabel && <span className="font-mono">{item.costLabel}</span>}
        </FrameFooter>
      )}
    </ChatInformationalFrame>
  );
}

function RecoveryFrame({ item }: { item: ChatRecoveryItem }): ReactElement {
  const tone = getRecoveryTone(item.state);

  return (
    <ChatInformationalFrame
      description={item.message}
      icon={item.state === "resumed" ? (
        <CircleCheckIcon aria-hidden="true" className="size-4" />
      ) : item.state === "stopped" ? (
        <CircleDotIcon aria-hidden="true" className="size-4" />
      ) : (
        <CircleAlertIcon aria-hidden="true" className="size-4" />
      )}
      iconClassName={tone.icon}
      title={item.title}
      footer={(item.detail || item.actions?.length) && (
        <FrameFooter className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-muted-foreground text-xs">
          <div className="min-w-0 truncate">{item.detail}</div>
          {item.actions && item.actions.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              {item.actions.map((action) => (
                <Button key={action.id} size="sm" variant="outline">
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </FrameFooter>
      )}
    />
  );
}

export function ThinkingPanel({ item }: { item: ChatThinkingItem }): ReactElement {
  const [open, setOpen] = useState(Boolean(item.defaultOpen));

  return (
    <ChatInformationalFrame
      description={item.summary}
      icon={<SparklesIcon aria-hidden="true" className="size-4" />}
      onOpenChange={setOpen}
      open={open}
      right={<StatusBadge status={item.status} />}
      title={item.title}
    >
      <FramePanel className="mx-1 mb-1 p-4 text-muted-foreground text-sm leading-6">
        {item.detail}
        {item.costLabel && (
          <div className="mt-3 text-right font-mono text-xs">{item.costLabel}</div>
        )}
      </FramePanel>
    </ChatInformationalFrame>
  );
}

export function CustomSurfaceCard({
  description,
  detailLines = [],
  status = "queued",
  title,
  type
}: {
  description: string;
  detailLines?: string[];
  status?: ChatRunStatus;
  title: string;
  type: string;
}): ReactElement {
  return (
    <ChatInformationalFrame
      description={description}
      icon={<BracesIcon aria-hidden="true" className="size-4" />}
      right={<Badge variant="info">{type}</Badge>}
      title={title}
      footer={(
        <FrameFooter className="px-4 py-3">
          <StatusBadge status={status} />
        </FrameFooter>
      )}
    >
      <FramePanel className="mx-1 p-4">
        <div className="rounded-xl border bg-muted/40 p-4 font-mono text-sm">
          {detailLines.length > 0 ? (
            detailLines.map((line) => (
              <div className="truncate" key={line}>
                {line}
              </div>
            ))
          ) : (
            <div>No preview lines provided.</div>
          )}
        </div>
      </FramePanel>
    </ChatInformationalFrame>
  );
}

export function SubagentChainSurface({
  item
}: {
  item: Extract<ChatItem, { kind: "subagent-chain" }>;
}): ReactElement {
  const [open, setOpen] = useState(item.defaultOpen ?? true);
  const [selectedAgent, setSelectedAgent] = useState<ChatSubagent | null>(null);

  return (
    <>
      <ChatInformationalFrame
        description={item.summary}
        icon={<LinkIcon aria-hidden="true" className="size-4" />}
        onOpenChange={setOpen}
        open={open}
        right={item.action ? (
          <Button size="sm" type="button" variant="ghost">
            {item.action.label}
          </Button>
        ) : (
          <StatusBadge status={item.status} />
        )}
        title={item.title}
      >
        <FramePanel className="mx-1 mb-1 p-0">
          <div className="divide-y">
            {item.agents.map((agent) => (
              <SubagentRow agent={agent} key={agent.id} onOpen={setSelectedAgent} />
            ))}
          </div>
        </FramePanel>
      </ChatInformationalFrame>
      <SubagentDetailSheet agent={selectedAgent} onOpenChange={setSelectedAgent} />
    </>
  );
}

function SubagentRow({
  agent,
  onOpen
}: {
  agent: ChatSubagent;
  onOpen: (agent: ChatSubagent) => void;
}): ReactElement {
  return (
    <button
      aria-label={`Open ${agent.name} subagent details`}
      className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/36 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      onClick={() => onOpen(agent)}
      type="button"
    >
      <SubagentStatusIndicator status={agent.status} />
      <div className="min-w-0">
        <div className="truncate font-medium text-sm">
          {agent.name}
          {agent.model && (
            <span className="ml-2 font-normal text-muted-foreground">
              {agent.model}
            </span>
          )}
        </div>
        <div className="truncate text-muted-foreground text-xs">{agent.role}</div>
      </div>
      <div className="text-right text-muted-foreground text-xs">
        {agent.toolsLabel && <div>{agent.toolsLabel}</div>}
        {agent.durationLabel && (
          <div>
            {agent.durationLabel}
            {agent.status === "complete" && " total"}
          </div>
        )}
      </div>
      <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
    </button>
  );
}

function SubagentDetailSheet({
  agent,
  onOpenChange
}: {
  agent: ChatSubagent | null;
  onOpenChange: (agent: ChatSubagent | null) => void;
}): ReactElement {
  const activity = agent ? getSubagentActivity(agent) : [];

  return (
    <Sheet
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onOpenChange(null);
        }
      }}
      open={Boolean(agent)}
    >
      <SheetPopup className="max-w-sm" closeProps={{ "aria-label": "Close subagent details" }}>
        <SheetHeader>
          <div className="flex items-start justify-between gap-3 pe-8">
            <div className="min-w-0">
              <SheetTitle className="truncate">{agent?.name ?? "Subagent"}</SheetTitle>
              <SheetDescription className="truncate">
                {agent?.model ?? "Model pending"}
              </SheetDescription>
            </div>
            {agent && <StatusBadge status={agent.status} />}
          </div>
        </SheetHeader>
        <SheetPanel className="pt-1">
          <div className="flex flex-col gap-4">
            <div>
              <div className="font-medium text-sm">{agent?.role ?? "No task selected."}</div>
              <div className="mt-1 text-muted-foreground text-xs">
                {agent?.toolsLabel ?? "Waiting for runtime activity."}
                {agent?.durationLabel ? ` · ${agent.durationLabel}` : ""}
              </div>
            </div>
            <Separator />
            <div>
              <ol>
                {activity.map((entry) => (
                  <SubagentActivityRow entry={entry} key={entry.id} />
                ))}
              </ol>
            </div>
          </div>
        </SheetPanel>
      </SheetPopup>
    </Sheet>
  );
}

function SubagentActivityRow({
  entry
}: {
  entry: ChatSubagentActivity;
}): ReactElement {
  return (
    <li className="relative grid grid-cols-[1.25rem_1fr] gap-3 py-3">
      <span
        aria-hidden="true"
        className="absolute top-8 bottom-[-0.5rem] left-2.5 w-px bg-border last:hidden"
      />
      <span className="z-10 grid size-5 place-items-center rounded-full bg-background ring-4 ring-background">
        <SubagentStatusIndicator status={entry.status} />
      </span>
      <div className="min-w-0 pt-0.5">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="truncate font-medium text-sm">{entry.title}</div>
          {entry.timeLabel && (
            <div className="shrink-0 text-muted-foreground text-xs">{entry.timeLabel}</div>
          )}
        </div>
        {entry.description && (
          <div className="mt-1 text-muted-foreground text-xs leading-5">
            {entry.description}
          </div>
        )}
      </div>
    </li>
  );
}

function getSubagentActivity(agent: ChatSubagent): ChatSubagentActivity[] {
  if (agent.activity && agent.activity.length > 0) {
    return agent.activity;
  }

  return [
    {
      description: agent.role,
      id: `${agent.id}-activity-started`,
      status: agent.status === "queued" ? "queued" : "complete",
      title: agent.status === "queued" ? "Waiting to start" : "Task accepted"
    },
    {
      description: agent.toolsLabel ?? "Runtime has not reported tool activity yet.",
      id: `${agent.id}-activity-tools`,
      status: agent.status,
      timeLabel: agent.durationLabel,
      title: getSubagentActivityTitle(agent.status)
    }
  ];
}

function getSubagentActivityTitle(status: ChatRunStatus): string {
  switch (status) {
    case "cancelled":
      return "Cancelled";
    case "complete":
      return "Completed work";
    case "error":
      return "Needs attention";
    case "queued":
      return "Queued";
    case "running":
    case "working":
      return "Working";
  }
}

function SubagentStatusIndicator({
  status
}: {
  status: ChatRunStatus;
}): ReactElement {
  if (status === "complete") {
    return (
      <span
        aria-label={status}
        className="flex size-3 items-center justify-center text-success"
      >
        <CheckIcon aria-hidden="true" className="size-3" />
      </span>
    );
  }

  return <StatusDot status={status} />;
}

function SummaryFrame({
  item
}: {
  item: Extract<ChatItem, { kind: "summary" }>;
}): ReactElement {
  return (
    <ChatInformationalFrame
      description={item.summaryType}
      icon={<MessagesSquareIcon aria-hidden="true" className="size-4" />}
      title={item.title}
    >
      <FramePanel className="mx-1 mb-1 p-4 text-sm leading-6">{item.content}</FramePanel>
    </ChatInformationalFrame>
  );
}

function ErrorFrame({
  item
}: {
  item: Extract<ChatItem, { kind: "error" }>;
}): ReactElement {
  const [detailOpen, setDetailOpen] = useState(true);

  return (
    <ChatInformationalFrame
      collapsible={Boolean(item.detail)}
      description={item.message}
      icon={<CircleAlertIcon aria-hidden="true" className="size-4" />}
      iconClassName="border-destructive/32 bg-destructive/8 text-destructive"
      onOpenChange={setDetailOpen}
      open={detailOpen}
      title={item.title}
      tone="danger"
    >
      {item.detail && <FrameFooter className="px-4 py-3 text-sm">{item.detail}</FrameFooter>}
    </ChatInformationalFrame>
  );
}

function VerificationSummaryFrame({
  item
}: {
  item: Extract<ChatItem, { kind: "verification-summary" }>;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const completedChecks = item.checks.filter((check) =>
    check.status === "passed" || check.status === "failed" || check.status === "skipped"
  ).length;
  const progressPercent = item.checks.length > 0
    ? Math.round((completedChecks / item.checks.length) * 100)
    : 0;

  return (
    <ChatInformationalFrame
      description={<VerificationStatusBadge status={item.status} />}
      descriptionClassName="mt-1 flex"
      icon={<TerminalIcon aria-hidden="true" className="size-4" />}
      onOpenChange={setOpen}
      open={open}
      title={item.title}
    >
      <FramePanel className="mx-1 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              aria-label="Verification progress"
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progressPercent}
              className={cn(
                "h-full rounded-full",
                item.status === "failed" || item.status === "blocked" ? "bg-destructive" : "bg-success"
              )}
              role="progressbar"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-muted-foreground text-xs">
            {completedChecks}/{item.checks.length}
          </span>
        </div>
        <div className="divide-y rounded-lg border bg-background">
          {item.checks.map((check) => (
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2" key={check.id}>
              <VerificationCheckIcon status={check.status} />
              <div className="min-w-0">
                <div className="truncate font-medium text-sm">{check.label}</div>
                <div className="truncate font-mono text-muted-foreground text-xs">{check.command}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {check.durationLabel && (
                  <span className="font-mono text-muted-foreground text-xs">{check.durationLabel}</span>
                )}
                <VerificationCheckBadge status={check.status} />
              </div>
            </div>
          ))}
        </div>
      </FramePanel>
    </ChatInformationalFrame>
  );
}

function GitHubAutomationReadyFrame({
  item
}: {
  item: Extract<ChatItem, { kind: "github-automation-ready" }>;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const visibleFiles = showAllFiles ? item.files : item.files.slice(0, 4);
  const hiddenFileCount = Math.max(item.files.length - visibleFiles.length, 0);

  return (
    <ChatInformationalFrame
      description={formatGitHubAutomationSummary(item.summary)}
      icon={<GitBranchIcon aria-hidden="true" className="size-4" />}
      onOpenChange={setOpen}
      open={open}
      right={(
        <Button size="sm" type="button" variant="outline">
          {getGitHubNextActionLabel(item.nextAction)}
        </Button>
      )}
      title={item.title}
    >
      <FramePanel className="mx-1 p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0 rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <GitBranchIcon aria-hidden="true" className="size-3.5" />
              Branch
            </div>
            <div className="mt-1 truncate font-mono text-sm">{item.branch}</div>
          </div>
          <div className="rounded-lg border bg-background p-3 text-right">
            <div className="text-muted-foreground text-xs">Changed files</div>
            <div className="mt-1 font-mono text-sm">{item.files.length}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleFiles.map((file) => (
            <GitHubAutomationFileBadge file={file} key={`${file.status}-${file.path}`} />
          ))}
          {hiddenFileCount > 0 && (
            <button
              className="inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
              onClick={() => setShowAllFiles(true)}
              type="button"
            >
              <Badge className="cursor-pointer" variant="info">
                +{hiddenFileCount} more
              </Badge>
            </button>
          )}
        </div>
      </FramePanel>
    </ChatInformationalFrame>
  );
}

function GitHubAutomationFileBadge({
  file
}: {
  file: Extract<ChatItem, { kind: "github-automation-ready" }>["files"][number];
}): ReactElement {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge className="max-w-full" variant="outline" />
        }
      >
        <span className="font-mono text-muted-foreground">{file.status}</span>
        <span className="max-w-44 truncate">{file.path}</span>
      </TooltipTrigger>
      <TooltipPopup>{file.path}</TooltipPopup>
    </Tooltip>
  );
}

function GitHubAutomationErrorFrame({
  item
}: {
  item: Extract<ChatItem, { kind: "github-automation-error" }>;
}): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <ChatInformationalFrame
      description={item.failure.detail}
      icon={<CircleAlertIcon aria-hidden="true" className="size-4" />}
      iconClassName="border-destructive/32 bg-destructive/8 text-destructive"
      onOpenChange={setOpen}
      open={open}
      title={item.failure.title}
      tone="danger"
    >
      <FrameFooter className="px-4 py-3">
        <div className="min-w-0 text-muted-foreground text-xs">
          <span className="font-medium text-foreground">Recovery: </span>
          {item.failure.recoveryAction}
        </div>
      </FrameFooter>
    </ChatInformationalFrame>
  );
}

function ToolApprovalRequestFrame({
  item,
  onRespond
}: {
  item: Extract<ChatItem, { kind: "tool-approval-request" }>;
  onRespond?: (
    request: ToolApprovalResponseRequest
  ) => Promise<ToolApprovalResponseResult | void> | ToolApprovalResponseResult | void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<ToolApprovalDecision | "remembered" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const request = item.request;
  const isPending = request.status === "pending" && responseStatus === null;

  async function submitApproval(decision: ToolApprovalDecision, rememberChoice = false): Promise<void> {
    if (!onRespond || !isPending) {
      return;
    }

    setIsSubmitting(true);
    setResponseError(null);

    try {
      const result = await onRespond({
        decision,
        rememberChoice,
        requestId: request.id
      });

      if (result && result.ok === false) {
        setResponseError(result.errorMessage ?? "Pi could not record that approval response.");
        return;
      }

      setResponseStatus(rememberChoice ? "remembered" : decision);
    } catch (error) {
      setResponseError(error instanceof Error ? error.message : "Pi could not record that approval response.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ChatInformationalFrame
      description={request.summary}
      icon={<ShieldCheckIcon aria-hidden="true" className="size-4" />}
      iconClassName="border-warning/40 bg-warning/8 text-warning"
      onOpenChange={setOpen}
      open={open}
      right={<ApprovalRiskBadge risk={request.risk} />}
      title={request.title}
      tone="warning"
      footer={(
        <FrameFooter className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 text-muted-foreground text-xs">
            {responseStatus
              ? responseStatus === "remembered"
                ? "This approval was remembered."
                : `This approval was ${responseStatus}.`
              : isPending
                ? request.expiresAtLabel
                  ? `Waiting for approval. Expires ${request.expiresAtLabel}.`
                  : "Waiting for approval."
                : `This approval is ${request.status}.`}
            {responseError && <div className="mt-1 text-destructive">{responseError}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {request.canRemember && isPending && (
              <Button
                disabled={isSubmitting}
                onClick={() => void submitApproval("approved", true)}
                size="sm"
                type="button"
                variant="ghost"
              >
                Remember
              </Button>
            )}
            <Button
              disabled={!isPending || isSubmitting}
              onClick={() => void submitApproval("denied")}
              size="sm"
              type="button"
              variant="outline"
            >
              Deny
            </Button>
            <Button
              disabled={!isPending || isSubmitting}
              onClick={() => void submitApproval("approved")}
              size="sm"
              type="button"
            >
              Allow
            </Button>
          </div>
        </FrameFooter>
      )}
    >
      <FramePanel className="mx-1 p-4">
        <ApprovalMetadataGrid request={request} />
      </FramePanel>
    </ChatInformationalFrame>
  );
}

function ToolApprovalBlockedFrame({
  item,
  onRecoveryAction
}: {
  item: Extract<ChatItem, { kind: "tool-approval-blocked" }>;
  onRecoveryAction?: (blockedId: string, actionId: string) => Promise<void> | void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const blocked = item.blocked;

  async function selectRecoveryAction(actionId: string): Promise<void> {
    setSelectedActionId(actionId);
    await onRecoveryAction?.(blocked.id, actionId);
  }

  return (
    <ChatInformationalFrame
      description={blocked.summary}
      icon={<CircleAlertIcon aria-hidden="true" className="size-4" />}
      iconClassName="border-destructive/32 bg-destructive/8 text-destructive"
      onOpenChange={setOpen}
      open={open}
      right={<ApprovalRiskBadge risk={blocked.risk} />}
      title={blocked.title}
      tone="danger"
    >
      <FramePanel className="mx-1 p-4 text-sm leading-6">
        {blocked.detail ?? "Pi blocked the action because the current permission policy requires review."}
      </FramePanel>
      <FrameFooter className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-muted-foreground text-xs">
          <Badge variant="error">{blocked.category}</Badge>
          <span className="truncate">{blocked.actionLabel}</span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {blocked.recoveryActions.map((action) => (
            <Button
              key={action.id}
              onClick={() => void selectRecoveryAction(action.id)}
              size="sm"
              type="button"
              variant={selectedActionId === action.id ? "secondary" : "outline"}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </FrameFooter>
    </ChatInformationalFrame>
  );
}

function ChangeSummaryFrame({
  item,
  onExternalFileOpen
}: {
  item: Extract<ChatItem, { kind: "change-summary" }>;
  onExternalFileOpen?: (path: string) => Promise<void> | void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const visibleFiles = item.files.slice(0, 5);
  const hiddenFileCount = Math.max(item.files.length - visibleFiles.length, 0);
  const highImpactCount = item.files.filter((file) => file.impact === "high").length;

  return (
    <ChatInformationalFrame
      description={item.summary}
      icon={<FileTextIcon aria-hidden="true" className="size-4" />}
      onOpenChange={setOpen}
      open={open}
      right={<Badge variant="outline">{item.files.length} files</Badge>}
      title={item.title}
    >
      <FramePanel className="mx-1 p-4">
        <div className={cn("grid gap-3", highImpactCount > 0 && "sm:grid-cols-[minmax(0,1fr)_auto]")}>
          <div className="min-w-0 rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <GitBranchIcon aria-hidden="true" className="size-3.5" />
              Branch
            </div>
            <div className="mt-1 truncate font-mono text-sm">{item.branch ?? "detached"}</div>
          </div>
          {highImpactCount > 0 && (
            <div className="rounded-lg border bg-background p-3 text-right">
              <div className="text-muted-foreground text-xs">Impact</div>
              <div className="mt-1 flex h-4.5 items-center justify-end sm:h-4.5">
                <Badge
                  className="-my-1"
                  size="lg"
                  variant={getChangeImpactVariant("high")}
                >
                  {highImpactCount} high
                </Badge>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 divide-y rounded-lg border bg-background">
          {visibleFiles.map((file) => (
            <ChangeFileRow
              file={file}
              key={`${file.status}-${file.path}`}
              onExternalFileOpen={onExternalFileOpen}
            />
          ))}
          {hiddenFileCount > 0 && (
            <div className="px-3 py-2 text-muted-foreground text-xs">
              +{hiddenFileCount} more changed file{hiddenFileCount === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </FramePanel>
    </ChatInformationalFrame>
  );
}

function ChangeReviewDiffFrame({
  item,
  onExternalFileOpen
}: {
  item: Extract<ChatItem, { kind: "change-review-diff" }>;
  onExternalFileOpen?: (path: string) => Promise<void> | void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const firstFile = item.files[0];
  const hasSingleModifiedFile = item.files.length === 1 && firstFile?.status === "modified";

  return (
    <ChatInformationalFrame
      description={item.summary}
      icon={<FileCodeIcon aria-hidden="true" className="size-4" />}
      onOpenChange={setOpen}
      open={open}
      right={<Badge variant="outline">{item.files.length} files</Badge>}
      title={item.title}
    >
      <FramePanel className={cn("mx-1", hasSingleModifiedFile ? "overflow-hidden p-0" : "p-4")}>
        {firstFile ? (
          hasSingleModifiedFile ? (
            <ChangeDiffFileView
              file={firstFile}
              onExternalFileOpen={onExternalFileOpen}
              framed={false}
              showDeltaInHeaderRight
            />
          ) : (
            <div className="flex flex-col gap-3">
              {item.files.map((file) => (
                <ChangeDiffFileView
                  file={file}
                  key={`${file.status}-${file.path}`}
                  onExternalFileOpen={onExternalFileOpen}
                />
              ))}
            </div>
          )
        ) : (
          <div className="rounded-lg border bg-background p-3 text-muted-foreground text-sm">
            No diff is available for this change set.
          </div>
        )}
      </FramePanel>
    </ChatInformationalFrame>
  );
}

function CheckpointUndoConfirmationFrame({
  item,
  onExternalFileOpen,
  onRestore
}: {
  item: Extract<ChatItem, { kind: "checkpoint-undo-confirmation" }>;
  onExternalFileOpen?: (path: string) => Promise<void> | void;
  onRestore?: (
    checkpointId: string
  ) => Promise<RestoreChangeCheckpointResult | void> | RestoreChangeCheckpointResult | void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<RestoreChangeCheckpointResult["status"] | "idle">("idle");
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  async function restoreCheckpoint(): Promise<void> {
    if (!onRestore || isRestoring) {
      return;
    }

    setIsRestoring(true);
    setRestoreError(null);

    try {
      const result = await onRestore(item.checkpoint.id);
      if (result) {
        setRestoreStatus(result.status);
        setRestoreError(result.errorMessage ?? null);
      } else {
        setRestoreStatus("restored");
      }
    } catch (error) {
      setRestoreStatus("failed");
      setRestoreError(error instanceof Error ? error.message : "Checkpoint restore failed.");
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <ChatInformationalFrame
      description={item.summary}
      icon={<ClockIcon aria-hidden="true" className="size-4" />}
      iconClassName="border-warning/40 bg-warning/8 text-warning"
      onOpenChange={setOpen}
      open={open}
      right={<Badge variant="warning">confirm</Badge>}
      title={item.title}
      tone="warning"
      footer={(
        <FrameFooter className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 text-muted-foreground text-xs">
            {restoreStatus === "idle"
              ? "Restoring a checkpoint can discard generated work after the checkpoint."
              : restoreStatus === "restored"
                ? "Checkpoint restored."
                : restoreStatus === "partial"
                  ? "Checkpoint partially restored."
                  : "Checkpoint restore failed."}
            {restoreError && <div className="mt-1 text-destructive">{restoreError}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              disabled={isRestoring}
              onClick={() => {
                setRestoreStatus("idle");
                setRestoreError(null);
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!onRestore || isRestoring || restoreStatus === "restored"}
              onClick={() => void restoreCheckpoint()}
              size="sm"
              type="button"
            >
              Restore checkpoint
            </Button>
          </div>
        </FrameFooter>
      )}
    >
      <FramePanel className="mx-1 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-background p-3">
            <div className="text-muted-foreground text-xs">Checkpoint</div>
            <div className="mt-1 truncate font-mono text-sm">{item.checkpoint.id}</div>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="text-muted-foreground text-xs">Branch</div>
            <div className="mt-1 truncate font-mono text-sm">{item.checkpoint.branch ?? "detached"}</div>
          </div>
        </div>
        <div className="mt-3 divide-y rounded-lg border bg-background">
          {item.files.slice(0, 4).map((file) => (
            <ChangeFileRow
              file={file}
              key={`${file.status}-${file.path}`}
              onExternalFileOpen={onExternalFileOpen}
            />
          ))}
        </div>
      </FramePanel>
    </ChatInformationalFrame>
  );
}

function ChangeRecoveryFrame({
  item,
  onExternalFileOpen
}: {
  item: Extract<ChatItem, { kind: "change-recovery" }>;
  onExternalFileOpen?: (path: string) => Promise<void> | void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const recovery = item.recovery;
  const firstFile = recovery.files[0];
  const hasSingleFile = recovery.files.length === 1;

  return (
    <ChatInformationalFrame
      description={recovery.summary}
      icon={<CircleAlertIcon aria-hidden="true" className="size-4" />}
      iconClassName="border-destructive/32 bg-destructive/8 text-destructive"
      onOpenChange={setOpen}
      open={open}
      right={<Badge variant="error">{getChangeRecoveryLabel(recovery.kind)}</Badge>}
      title={recovery.title}
      tone="danger"
      footer={(
        <FrameFooter className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-[12rem] flex-1 text-muted-foreground text-xs">{recovery.detail}</div>
          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
            {recovery.actions.map((action) => (
              <Button key={action.id} size="sm" type="button" variant="outline">
                {action.label}
              </Button>
            ))}
          </div>
        </FrameFooter>
      )}
    >
      <FramePanel className={cn("mx-1", hasSingleFile ? "overflow-hidden p-0" : "p-4")}>
        {hasSingleFile && firstFile ? (
          <ChangeFileRow file={firstFile} onExternalFileOpen={onExternalFileOpen} />
        ) : (
          <div className="divide-y rounded-lg border bg-background">
            {recovery.files.map((file) => (
              <ChangeFileRow
                file={file}
                key={`${file.status}-${file.path}`}
                onExternalFileOpen={onExternalFileOpen}
              />
            ))}
          </div>
        )}
      </FramePanel>
    </ChatInformationalFrame>
  );
}

function OperatorRunFrame({
  item
}: {
  item: Extract<ChatItem, { kind: "operator-run" }>;
}): ReactElement {
  const run = item.run;
  const [open, setOpen] = useState(item.defaultOpen ?? run.stage === "needs-attention");
  const activeStepId = run.activeStepId ?? run.steps.find((step) =>
    step.status === "running" || step.status === "needs-attention" || step.status === "blocked"
  )?.id;

  return (
    <ChatInformationalFrame
      description={<Badge variant={getOperatorRunBadgeVariant(run.stage)}>{getOperatorRunStageLabel(run.stage)}</Badge>}
      descriptionClassName="mt-1 flex"
      icon={<SparklesIcon aria-hidden="true" className="size-4" />}
      iconClassName={getOperatorRunIconClassName(run.stage)}
      onOpenChange={setOpen}
      open={open}
      right={<OperatorRunHeaderActions run={run} />}
      title={run.title}
      tone={run.stage === "needs-attention" || run.stage === "waiting-approval" ? "warning" : "default"}
    >
      <FramePanel className="mx-1 p-4">
        <div className="rounded-lg border bg-background p-3">
          <div className="text-muted-foreground text-xs">Objective</div>
          <div className="mt-1 truncate text-sm">{run.objective}</div>
        </div>
        <div className="mt-3 divide-y rounded-lg border bg-background">
          {run.steps.map((step) => (
            <div
              className={cn(
                "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5",
                step.id === activeStepId && "bg-muted/36"
              )}
              key={step.id}
            >
              <OperatorRunStepIcon status={step.status} />
              <div className="min-w-0">
                <div className="truncate font-medium text-sm">{step.title}</div>
                {step.summary && (
                  <div className="truncate text-muted-foreground text-xs">{step.summary}</div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={getOperatorRunStepBadgeVariant(step.status)}>
                  {getOperatorRunStepLabel(step.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        {run.recovery && (
          <div className="mt-3 rounded-lg border border-warning/32 bg-warning/8 p-3 text-sm">
            <div className="font-medium">{run.recovery.title}</div>
            <div className="mt-1 text-muted-foreground text-xs leading-5">
              {run.recovery.detail}
            </div>
          </div>
        )}
      </FramePanel>
    </ChatInformationalFrame>
  );
}

function OperatorRunHeaderActions({
  run
}: {
  run: Extract<ChatItem, { kind: "operator-run" }>["run"];
}): ReactElement | null {
  if (run.stage === "waiting-approval") {
    return (
      <div className="flex shrink-0 items-center">
        <Button
          className="rounded-r-none"
          size="sm"
          type="button"
          variant="outline"
        >
          Approve
        </Button>
        <Menu>
          <MenuTrigger
            render={
              <Button
                aria-label="Open operator run review menu"
                className="-ml-px rounded-l-none px-2"
                size="sm"
                type="button"
                variant="outline"
              >
                <ChevronDownIcon aria-hidden="true" className="size-4" />
              </Button>
            }
          />
          <MenuPopup align="end" className="min-w-40">
            <MenuItem closeOnClick>Open review</MenuItem>
          </MenuPopup>
        </Menu>
      </div>
    );
  }

  if (run.stage === "resumable") {
    return (
      <Button size="sm" type="button" variant="outline">
        {run.recovery?.actionLabel ?? "Resume run"}
      </Button>
    );
  }

  return null;
}

function OperatorRunStepIcon({
  status
}: {
  status: Extract<ChatItem, { kind: "operator-run" }>["run"]["steps"][number]["status"];
}): ReactElement {
  if (status === "completed") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-success/8 text-success">
        <CheckIcon aria-hidden="true" className="size-3" />
      </span>
    );
  }

  if (status === "blocked" || status === "needs-attention") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-warning/8 text-warning">
        <CircleAlertIcon aria-hidden="true" className="size-3" />
      </span>
    );
  }

  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-muted">
      <StatusDot status={status === "running" ? "running" : "queued"} />
    </span>
  );
}

function getOperatorRunStageLabel(
  stage: Extract<ChatItem, { kind: "operator-run" }>["run"]["stage"]
): string {
  switch (stage) {
    case "accepted":
      return "Accepted";
    case "automating":
      return "Automating";
    case "completed":
      return "Completed";
    case "needs-attention":
      return "Needs attention";
    case "resumable":
      return "Resumable";
    case "running":
      return "Running";
    case "verifying":
      return "Verifying";
    case "waiting-approval":
      return "Needs approval";
  }
}

function getOperatorRunBadgeVariant(
  stage: Extract<ChatItem, { kind: "operator-run" }>["run"]["stage"]
): BadgeProps["variant"] {
  switch (stage) {
    case "completed":
      return "success";
    case "needs-attention":
    case "waiting-approval":
      return "warning";
    case "accepted":
    case "automating":
    case "resumable":
    case "running":
    case "verifying":
      return "info";
  }
}

function getOperatorRunIconClassName(
  stage: Extract<ChatItem, { kind: "operator-run" }>["run"]["stage"]
): string {
  switch (stage) {
    case "completed":
      return "border-success/30 bg-success/8 text-success";
    case "needs-attention":
    case "waiting-approval":
      return "border-warning/40 bg-warning/8 text-warning";
    case "accepted":
    case "automating":
    case "resumable":
    case "running":
    case "verifying":
      return "border-info/30 bg-info/8 text-info-foreground";
  }
}

function getOperatorRunStepLabel(
  status: Extract<ChatItem, { kind: "operator-run" }>["run"]["steps"][number]["status"]
): string {
  switch (status) {
    case "blocked":
      return "Blocked";
    case "completed":
      return "Completed";
    case "needs-attention":
      return "Needs attention";
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "skipped":
      return "Skipped";
  }
}

function getOperatorRunStepBadgeVariant(
  status: Extract<ChatItem, { kind: "operator-run" }>["run"]["steps"][number]["status"]
): BadgeProps["variant"] {
  switch (status) {
    case "blocked":
      return "error";
    case "completed":
      return "success";
    case "needs-attention":
      return "warning";
    case "running":
      return "info";
    case "queued":
    case "skipped":
      return "outline";
  }
}

function BackgroundTaskFrame({
  item
}: {
  item: Extract<ChatItem, { kind: "background-task" }>;
}): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <ChatInformationalFrame
      description={item.summary}
      icon={<MessagesSquareIcon aria-hidden="true" className="size-4" />}
      iconClassName={getBackgroundTaskIconClassName(item.status)}
      onOpenChange={setOpen}
      open={open}
      right={<Badge variant={getBackgroundTaskBadgeVariant(item.status)}>{getBackgroundTaskLabel(item.status)}</Badge>}
      title={item.title}
      tone={item.status === "needs-attention" ? "warning" : "default"}
    >
      <FramePanel className="mx-1 p-4 text-muted-foreground text-sm leading-6">
        {item.detail ?? item.summary}
      </FramePanel>
    </ChatInformationalFrame>
  );
}

function getBackgroundTaskLabel(status: Extract<ChatItem, { kind: "background-task" }>["status"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "needs-attention":
      return "Needs attention";
    case "resumable":
      return "Resumable";
    case "running":
      return "Running";
  }
}

function getBackgroundTaskBadgeVariant(
  status: Extract<ChatItem, { kind: "background-task" }>["status"]
): BadgeProps["variant"] {
  switch (status) {
    case "completed":
      return "success";
    case "needs-attention":
      return "warning";
    case "resumable":
      return "info";
    case "running":
      return "outline";
  }
}

function getBackgroundTaskIconClassName(status: Extract<ChatItem, { kind: "background-task" }>["status"]): string {
  switch (status) {
    case "completed":
      return "border-success/30 bg-success/8 text-success";
    case "needs-attention":
      return "border-warning/40 bg-warning/8 text-warning";
    case "resumable":
      return "border-info/30 bg-info/8 text-info-foreground";
    case "running":
      return "border-info/30 bg-info/8 text-info-foreground";
  }
}

function ChangeDiffFileView({
  file,
  framed = true,
  onExternalFileOpen,
  showDeltaInHeaderRight = false
}: {
  file: Extract<ChatItem, { kind: "change-review-diff" }>["files"][number];
  framed?: boolean;
  onExternalFileOpen?: (path: string) => Promise<void> | void;
  showDeltaInHeaderRight?: boolean;
}): ReactElement {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="min-w-0">
          <ChangeFileExternalLink path={file.path} onExternalFileOpen={onExternalFileOpen} />
          {!showDeltaInHeaderRight && (
            <ChangeDeltaCounts additions={file.additions} deletions={file.deletions} />
          )}
        </div>
        {showDeltaInHeaderRight ? (
          <ChangeDeltaCounts additions={file.additions} deletions={file.deletions} />
        ) : (
          <Badge variant="outline">{file.status}</Badge>
        )}
      </div>
      <div className="max-h-72 overflow-auto font-mono text-xs">
        {file.lines.map((line, index) => (
          <div
            className={cn(
              "grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 px-3 py-1",
              line.kind === "added" && "bg-success/8 text-success",
              line.kind === "removed" && "bg-destructive/8 text-destructive",
              line.kind === "context" && "text-muted-foreground"
            )}
            key={`${line.kind}-${line.lineNumber ?? index}-${index}`}
          >
            <span className="select-none text-right opacity-70">{line.lineNumber ?? ""}</span>
            <span className="min-w-0 whitespace-pre-wrap break-words">{line.content}</span>
          </div>
        ))}
      </div>
      {file.truncated && (
        <div className="border-t px-3 py-2 text-muted-foreground text-xs">
          Diff truncated for readability.
        </div>
      )}
    </>
  );

  if (!framed) {
    return content;
  }

  return <div className="overflow-hidden rounded-lg border bg-background">{content}</div>;
}

function ChangeFileRow({
  file,
  onExternalFileOpen
}: {
  file: Extract<ChatItem, { kind: "change-summary" }>["files"][number];
  onExternalFileOpen?: (path: string) => Promise<void> | void;
}): ReactElement {
  const impactBadge =
    file.impact === "low" ? null : (
      <Badge variant={getChangeImpactVariant(file.impact)}>{file.impact}</Badge>
    );
  const deltaCounts = (
    <ChangeDeltaCounts additions={file.additions} deletions={file.deletions} />
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2">
      <div className="min-w-0">
        <ChangeFileExternalLink path={file.path} onExternalFileOpen={onExternalFileOpen} />
        <div className="truncate text-muted-foreground text-xs">{file.summary}</div>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-1">
        {impactBadge}
        {deltaCounts}
      </div>
    </div>
  );
}

function ChangeFileExternalLink({
  path,
  onExternalFileOpen
}: {
  path: string;
  onExternalFileOpen?: (path: string) => Promise<void> | void;
}): ReactElement {
  function openFile(event: MouseEvent<HTMLAnchorElement>): void {
    event.preventDefault();
    void onExternalFileOpen?.(path);
  }

  return (
    <a
      aria-label={`Open ${path} externally`}
      className="group inline-flex max-w-full items-center gap-1.5 border-transparent border-b pb-0.5 font-mono text-info-foreground text-sm leading-none transition-colors hover:border-info-foreground focus-visible:border-info-foreground focus-visible:outline-2 focus-visible:outline-ring"
      href="#"
      onClick={openFile}
      title={`Open ${path} externally`}
    >
      <span className="truncate">{path}</span>
      <ExternalLinkIcon
        aria-hidden="true"
        className="size-3.5 shrink-0 text-current opacity-70 transition-opacity group-hover:opacity-100"
      />
    </a>
  );
}

function ChangeDeltaCounts({
  additions,
  deletions
}: {
  additions?: number;
  deletions?: number;
}): ReactElement | null {
  if (additions === undefined && deletions === undefined) {
    return null;
  }

  const additionCount = additions ?? 0;
  const deletionCount = deletions ?? 0;

  return (
    <span
      aria-label={`${additionCount} additions, ${deletionCount} deletions`}
      className="flex items-center gap-1.5 font-mono font-medium text-xs"
    >
      <span className="text-success">+{additionCount}</span>
      <span aria-hidden="true" className="font-normal text-foreground">
        /
      </span>
      <span className="text-destructive">-{deletionCount}</span>
    </span>
  );
}

function ApprovalMetadataGrid({
  request
}: {
  request: ToolApprovalRequest;
}): ReactElement {
  const rows = [
    ["Action", request.actionLabel],
    ["Category", request.category],
    ["Target", request.targetLabel],
    ["Project", request.projectLabel],
    ["Requested by", request.requester],
    ["Command", request.commandPreview]
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <div className="divide-y rounded-lg border bg-background">
      {rows.map(([label, value]) => (
        <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 px-3 py-2 text-sm" key={label}>
          <div className="text-muted-foreground">{label}</div>
          <div className={cn("min-w-0 truncate", label === "Command" && "font-mono text-xs")}>
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ApprovalRiskBadge({ risk }: { risk: ToolPermissionRisk }): ReactElement {
  if (risk === "destructive") {
    return <Badge variant="error">destructive</Badge>;
  }

  if (risk === "elevated") {
    return <Badge variant="warning">review</Badge>;
  }

  return <Badge variant="success">safe</Badge>;
}

export function ChatComposer({
  attachments = [],
  commands = CHAT_BODY_COMMANDS,
  draft = "",
  dragState = "idle",
  mentions = CHAT_BODY_MENTIONS,
  mode = "default",
  onSubmit,
  onStopRun,
  planMode = false,
  runStatus = "idle",
  selectedTokens = [],
  submitErrorMessage
}: {
  attachments?: ChatAttachment[];
  commands?: ChatCommandOption[];
  dragState?: "drag-over" | "idle" | "unsupported";
  draft?: string;
  mentions?: ChatMentionOption[];
  mode?: "default" | "mention" | "slash";
  onSubmit?: (
    payload: ChatComposerSubmitPayload
  ) => ChatComposerSubmitResult | Promise<ChatComposerSubmitResult | void> | void;
  onStopRun?: () => Promise<void> | void;
  planMode?: boolean;
  runStatus?: ChatComposerRunStatus;
  selectedTokens?: ChatToken[];
  submitErrorMessage?: string;
}): ReactElement {
  const [visibleAttachments, setVisibleAttachments] = useState(attachments);
  const [visibleSelectedTokens, setVisibleSelectedTokens] = useState(selectedTokens);
  const [draftText, setDraftText] = useState(draft);
  const [isPlanModeBadgeVisible, setIsPlanModeBadgeVisible] = useState(planMode);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [submitState, setSubmitState] = useState<"error" | "idle" | "submitting">(
    submitErrorMessage ? "error" : "idle"
  );
  const [submitError, setSubmitError] = useState<string | null>(submitErrorMessage ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localPreviewUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setVisibleAttachments(attachments);
  }, [attachments]);

  useEffect(() => {
    setVisibleSelectedTokens(selectedTokens);
  }, [selectedTokens]);

  useEffect(() => {
    setDraftText(draft);
  }, [draft]);

  useEffect(() => {
    setIsPlanModeBadgeVisible(planMode);
  }, [planMode]);

  useEffect(() => {
    setSubmitError(submitErrorMessage ?? null);
    setSubmitState(submitErrorMessage ? "error" : "idle");
  }, [submitErrorMessage]);

  useEffect(
    () => () => {
      localPreviewUrlsRef.current.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
      localPreviewUrlsRef.current.clear();
    },
    []
  );

  const hasDraftContent =
    draftText.trim().length > 0 ||
    visibleAttachments.length > 0 ||
    visibleSelectedTokens.length > 0;
  const hasDraftText = draftText.trim().length > 0;
  const canQueueDuringRun = runStatus === "running" && hasDraftText;
  const canSubmit =
    runStatus !== "stopping" &&
    submitState !== "submitting" &&
    (runStatus !== "running" || canQueueDuringRun) &&
    hasDraftContent;
  const canStopRun = runStatus === "running" && !canQueueDuringRun;
  const isStoppingRun = runStatus === "stopping";
  const isDropUnsupported = dragState === "unsupported";
  const isDropActive = dragState === "drag-over" || isDraggingFiles || isDropUnsupported;
  const activePicker =
    mode === "slash"
      ? {
          content: <SlashCommandPicker commands={commands} />,
          title: "Commands"
        }
      : mode === "mention"
        ? {
            content: <MentionPicker mentions={mentions} />,
            title: "Mentions"
          }
        : null;

  function handleAttachFiles(files: FileList | null): void {
    if (!files || files.length === 0) {
      return;
    }

    const nextAttachments = Array.from(files).map((file) => {
      const isImage = file.type.startsWith("image/");
      const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

      if (previewUrl) {
        localPreviewUrlsRef.current.add(previewUrl);
      }

      return {
        id: `local-file-${file.name}-${file.size}-${file.lastModified}`,
        kind: isImage ? "image" : "file",
        mimeType: file.type || undefined,
        name: file.name,
        previewState: isImage ? "available" : "unknown",
        previewUrl,
        sizeLabel: formatFileSize(file.size),
        source: "local-file",
        uploadStatus: "complete"
      };
    }) satisfies ChatAttachment[];

    setVisibleAttachments((currentAttachments) => [
      ...currentAttachments,
      ...nextAttachments
    ]);
  }

  async function handleSubmit(
    intent: "queue" | "send" | "steer" = "send"
  ): Promise<void> {
    if (!canSubmit) {
      return;
    }

    setSubmitState("submitting");
    setSubmitError(null);

    const payload = {
      attachments: visibleAttachments,
      intent,
      planMode: isPlanModeBadgeVisible,
      selectedTokens: visibleSelectedTokens,
      text: draftText
    };

    try {
      const result = await onSubmit?.(payload);

      if (result && result.accepted === false) {
        setSubmitState("error");
        setSubmitError(result.errorMessage ?? "The message could not be sent.");
        return;
      }

      localPreviewUrlsRef.current.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
      localPreviewUrlsRef.current.clear();
      setDraftText("");
      setVisibleAttachments([]);
      setVisibleSelectedTokens([]);
      setSubmitState("idle");
    } catch (error) {
      setSubmitState("error");
      setSubmitError(error instanceof Error ? error.message : "The message could not be sent.");
    }
  }

  async function handleStopRun(): Promise<void> {
    try {
      setSubmitError(null);
      await onStopRun?.();
    } catch (error) {
      setSubmitState("error");
      setSubmitError(error instanceof Error ? error.message : "The active run could not be stopped.");
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (event.metaKey) {
      void handleSubmit("steer");
      return;
    }

    void handleSubmit(canQueueDuringRun ? "queue" : "send");
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>): void {
    if (isDropUnsupported) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFiles(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    if (isDropUnsupported) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDraggingFiles(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDraggingFiles(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingFiles(false);

    if (isDropUnsupported) {
      return;
    }

    handleAttachFiles(event.dataTransfer.files);
  }

  return (
    <div
      className="relative mx-auto w-full max-w-3xl"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDropActive && (
        <div
          aria-live="polite"
          className={cn(
            "pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border border-dashed bg-background/88 text-sm shadow-sm backdrop-blur-[1px]",
            isDropUnsupported
              ? "border-destructive/50 text-destructive"
              : "border-info/60 text-info"
          )}
        >
          <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 shadow-xs">
            {isDropUnsupported ? (
              <CircleAlertIcon aria-hidden="true" className="size-4" />
            ) : (
              <PaperclipIcon aria-hidden="true" className="size-4" />
            )}
            {isDropUnsupported ? "Drag and drop is unavailable here." : "Drop files to attach"}
          </div>
        </div>
      )}
      {activePicker && (
        <div className="absolute inset-x-0 bottom-[calc(100%-1px)] z-10">
          <ComposerPickerFrame title={activePicker.title}>
            {activePicker.content}
          </ComposerPickerFrame>
        </div>
      )}
      <InputGroup
        className={cn(
          "flex-col items-stretch",
          activePicker && "rounded-t-none before:rounded-t-none"
        )}
      >
        {visibleAttachments.length > 0 && (
          <InputGroupAddon
            align="block-start"
            className="border-b bg-muted/72"
          >
            <AttachmentTray
              attachments={visibleAttachments}
              onRemove={(attachmentId) => {
                setVisibleAttachments((currentAttachments) => {
                  const attachmentToRemove = currentAttachments.find(
                    (attachment) => attachment.id === attachmentId
                  );

                  if (
                    attachmentToRemove?.previewUrl &&
                    localPreviewUrlsRef.current.has(attachmentToRemove.previewUrl)
                  ) {
                    URL.revokeObjectURL(attachmentToRemove.previewUrl);
                    localPreviewUrlsRef.current.delete(attachmentToRemove.previewUrl);
                  }

                  return currentAttachments.filter(
                    (attachment) => attachment.id !== attachmentId
                  );
                });
              }}
            />
          </InputGroupAddon>
        )}
        {visibleSelectedTokens.length > 0 ? (
          <ComposerDraftPreview
            onRemoveToken={(tokenId) =>
              setVisibleSelectedTokens((currentTokens) =>
                currentTokens.filter((token) => token.id !== tokenId)
              )
            }
            selectedTokens={visibleSelectedTokens}
          />
        ) : (
          <InputGroupTextarea
            aria-label="Chat message"
            className="max-h-36 overflow-y-auto overscroll-contain"
            disabled={submitState === "submitting"}
            onChange={(event) => {
              setDraftText(event.currentTarget.value);
              if (submitState === "error") {
                setSubmitState("idle");
                setSubmitError(null);
              }
            }}
            placeholder="Message Pi..."
            onKeyDown={handleComposerKeyDown}
            rows={3}
            value={draftText}
          />
        )}
        {submitError && (
          <InputGroupAddon align="block-start" className="border-t text-destructive text-xs">
            <CircleAlertIcon aria-hidden="true" className="size-3.5" />
            {submitError}
          </InputGroupAddon>
        )}
        <InputGroupAddon align="block-end" className="justify-between">
          <div className="flex items-center gap-1">
            <input
              aria-hidden="true"
              className="hidden"
              multiple
              onChange={(event) => {
                handleAttachFiles(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
              ref={fileInputRef}
              tabIndex={-1}
              type="file"
            />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label="Attach file"
                    onClick={() => fileInputRef.current?.click()}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  />
                }
              >
                <PaperclipIcon aria-hidden="true" />
              </TooltipTrigger>
              <TooltipPopup>Attach file</TooltipPopup>
            </Tooltip>
            {isPlanModeBadgeVisible && (
              <PlanModeBadge
                className="ml-6"
                onDismiss={() => setIsPlanModeBadgeVisible(false)}
              />
            )}
          </div>
          <ComposerActionButton
            canShowShortcutCard={canQueueDuringRun}
            canStopRun={canStopRun}
            canSubmit={canSubmit}
            isStoppingRun={isStoppingRun}
            onSend={() =>
              void handleSubmit(canQueueDuringRun ? "queue" : "send")
            }
            onStop={() => void handleStopRun()}
            submitIntent={canQueueDuringRun ? "queue" : "send"}
            submitState={submitState}
          />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function ComposerActionButton({
  canShowShortcutCard,
  canStopRun,
  canSubmit,
  isStoppingRun,
  onSend,
  onStop,
  submitIntent,
  submitState
}: {
  canShowShortcutCard: boolean;
  canStopRun: boolean;
  canSubmit: boolean;
  isStoppingRun: boolean;
  onSend: () => void;
  onStop: () => void;
  submitIntent: "queue" | "send";
  submitState: "error" | "idle" | "submitting";
}): ReactElement {
  const actionLabel =
    canStopRun || isStoppingRun
      ? "Stop active run"
      : submitIntent === "queue"
        ? "Queue message"
        : "Send message";

  const actionButton = (
    <Button
      aria-label={actionLabel}
      className="rounded-full"
      disabled={isStoppingRun || (!canStopRun && !canSubmit)}
      loading={submitState === "submitting" || isStoppingRun}
      onClick={canStopRun ? onStop : onSend}
      size="icon-sm"
      type="button"
    >
      {canStopRun || isStoppingRun ? (
        <XIcon aria-hidden="true" />
      ) : (
        <ArrowUpIcon aria-hidden="true" />
      )}
    </Button>
  );

  if (!canShowShortcutCard) {
    return actionButton;
  }

  return (
    <PreviewCard>
      <PreviewCardTrigger render={actionButton} />
      <PreviewCardPopup
        align="end"
        className="flex w-40 flex-col gap-1 p-2"
        sideOffset={8}
      >
        <ComposerShortcutHint label="Queue" shortcut="enter" />
        <ComposerShortcutHint label="Steer" shortcut="command-enter" />
      </PreviewCardPopup>
    </PreviewCard>
  );
}

function ComposerShortcutHint({
  label,
  shortcut
}: {
  label: string;
  shortcut: "command-enter" | "enter";
}): ReactElement {
  return (
    <div className="grid w-full grid-cols-[1fr_auto] items-center gap-4 rounded-md px-1.5 py-1 text-sm">
      <span>{label}</span>
      {shortcut === "enter" ? (
        <Kbd>
          <span aria-hidden="true">↩</span>
          <span className="sr-only">Enter</span>
        </Kbd>
      ) : (
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>
            <span aria-hidden="true">↩</span>
            <span className="sr-only">Enter</span>
          </Kbd>
        </KbdGroup>
      )}
    </div>
  );
}

function ComposerPickerFrame({
  children,
  title
}: {
  children: ReactElement;
  title: string;
}): ReactElement {
  return (
    <div className="overflow-hidden rounded-t-[calc(var(--radius-lg)-1px)] border border-input border-b-0 bg-popover shadow-xs/5">
      <FrameHeader className="rounded-t-[calc(var(--radius-lg)-1px)] bg-muted/72 px-3 py-2">
        <FrameTitle className="text-muted-foreground text-xs">{title}</FrameTitle>
      </FrameHeader>
      {children}
    </div>
  );
}

function formatFileSize(sizeInBytes: number): string {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  const sizeInKilobytes = sizeInBytes / 1024;

  if (sizeInKilobytes < 1024) {
    return `${Math.round(sizeInKilobytes)} KB`;
  }

  return `${(sizeInKilobytes / 1024).toFixed(1)} MB`;
}

function ComposerDraftPreview({
  onRemoveToken,
  selectedTokens
}: {
  onRemoveToken: (tokenId: string) => void;
  selectedTokens: ChatToken[];
}): ReactElement {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key !== "Backspace" && event.key !== "Delete") {
      return;
    }

    const target = event.target;

    if (target instanceof HTMLElement && target.dataset.composerToken === "true") {
      return;
    }

    const token =
      event.key === "Backspace"
        ? selectedTokens[selectedTokens.length - 1]
        : selectedTokens[0];

    if (!token) {
      return;
    }

    event.preventDefault();
    onRemoveToken(token.id);
  }

  return (
    <div
      aria-label="Chat message"
      className="min-h-20.5 px-[calc(--spacing(3)-1px)] py-[calc(--spacing(3)-1px)] text-sm leading-6"
      onKeyDown={handleKeyDown}
      role="textbox"
      tabIndex={0}
    >
      <span className="text-muted-foreground">Review </span>
      {selectedTokens.map((token, tokenIndex) => (
        <span key={token.id}>
          {tokenIndex > 0 && <span className="text-muted-foreground"> with </span>}
          <InlineComposerToken onRemove={onRemoveToken} token={token} />
        </span>
      ))}
      <span className="text-muted-foreground">
        {" "}
        and summarize the current renderer state.
      </span>
    </div>
  );
}

function InlineComposerToken({
  onRemove,
  token
}: {
  onRemove: (tokenId: string) => void;
  token: ChatToken;
}): ReactElement {
  return (
    <Badge
      className="mx-0.5 align-baseline"
      render={
        <span
          aria-label={`Selected token ${token.kind === "command" ? "/" : "@"}${token.label}`}
          data-composer-token="true"
          onKeyDown={(event) => {
            if (event.key === "Backspace" || event.key === "Delete") {
              event.preventDefault();
              onRemove(token.id);
            }
          }}
          role="option"
          tabIndex={0}
        />
      }
      variant={token.kind === "command" ? "info" : "outline"}
    >
      {token.kind === "command" ? "/" : "@"}
      {token.label}
    </Badge>
  );
}

export function SlashCommandPicker({
  commands
}: {
  commands: ChatCommandOption[];
}): ReactElement {
  const groupedCommands = useMemo(
    () =>
      commands.reduce<Record<ChatCommandOption["source"], ChatCommandOption[]>>(
        (groups, command) => {
          groups[command.source].push(command);
          return groups;
        },
        { builtin: [], extension: [], prompt: [], skill: [] }
      ),
    [commands]
  );

  return (
    <Command value="">
      <CommandPanel className={EMBEDDED_PICKER_PANEL_CLASS}>
        <CommandInput placeholder="Filter slash commands" />
        <CommandList className={EMBEDDED_PICKER_LIST_CLASS}>
          {commands.length > 0 ? (
            (Object.keys(groupedCommands) as ChatCommandOption["source"][])
              .filter((source) => groupedCommands[source].length > 0)
              .map((source) => (
                <CommandGroup key={source}>
                  <CommandGroupLabel className="px-3">{source}</CommandGroupLabel>
                  {groupedCommands[source].map((command) => (
                    <CommandItem
                      className="mx-3 gap-3 px-3"
                      key={command.id}
                      value={command.name}
                    >
                      <BracesIcon aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{command.name}</div>
                        {command.description && (
                          <div className="truncate text-muted-foreground text-xs">
                            {command.description}
                          </div>
                        )}
                      </div>
                      {command.shortcut && (
                        <CommandShortcut>{command.shortcut}</CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
          ) : (
            <CommandEmpty>No commands available.</CommandEmpty>
          )}
        </CommandList>
      </CommandPanel>
    </Command>
  );
}

export function MentionPicker({
  mentions
}: {
  mentions: ChatMentionOption[];
}): ReactElement {
  return (
    <Command value="">
      <CommandPanel className={EMBEDDED_PICKER_PANEL_CLASS}>
        <CommandInput placeholder="Filter files, skills, and resources" />
        <CommandList className={EMBEDDED_PICKER_LIST_CLASS}>
          {mentions.length > 0 ? (
            <CommandGroup>
              <CommandGroupLabel className="px-3">Mentions</CommandGroupLabel>
              {mentions.map((mention) => (
                <CommandItem
                  className="mx-3 gap-3 px-3"
                  key={mention.id}
                  value={mention.label}
                >
                  {mention.kind === "file" ? (
                    <FileIcon aria-hidden="true" />
                  ) : (
                    <SparklesIcon aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{mention.label}</div>
                    <div className="truncate text-muted-foreground text-xs">
                      {mention.description ?? mention.path}
                    </div>
                  </div>
                  <CommandShortcut>@{mention.kind}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            <CommandEmpty>No mention targets available.</CommandEmpty>
          )}
        </CommandList>
      </CommandPanel>
    </Command>
  );
}

const EMBEDDED_PICKER_PANEL_CLASS =
  "mx-0 rounded-none! border-0 shadow-none [clip-path:none]! before:hidden not-has-[+[data-slot=command-footer]]:mb-0 not-has-[+[data-slot=command-footer]]:rounded-none! not-has-[+[data-slot=command-footer]]:[clip-path:none]!";

const EMBEDDED_PICKER_LIST_CLASS =
  "rounded-none! not-empty:p-0! not-empty:scroll-py-0!";

export function AttachmentTray({
  attachments,
  compact = false,
  initialPreviewAttachmentId,
  onRemove
}: {
  attachments: ChatAttachment[];
  compact?: boolean;
  initialPreviewAttachmentId?: string;
  onRemove?: (attachmentId: string) => void;
}): ReactElement {
  const [removingAttachmentIds, setRemovingAttachmentIds] = useState<Set<string>>(
    () => new Set()
  );
  const initialPreviewAttachment = useMemo(
    () =>
      initialPreviewAttachmentId
        ? attachments.find((attachment) => attachment.id === initialPreviewAttachmentId) ??
          null
        : null,
    [attachments, initialPreviewAttachmentId]
  );
  const [previewAttachment, setPreviewAttachment] = useState<ChatAttachment | null>(
    initialPreviewAttachment
  );

  useEffect(() => {
    setPreviewAttachment(initialPreviewAttachment);
  }, [initialPreviewAttachment]);

  function handleRemove(attachmentId: string): void {
    setRemovingAttachmentIds((currentIds) => new Set(currentIds).add(attachmentId));

    window.setTimeout(() => {
      onRemove?.(attachmentId);
      setRemovingAttachmentIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(attachmentId);
        return nextIds;
      });
    }, 160);
  }

  return (
    <>
      <div
        className={cn("flex flex-wrap gap-2", compact && "mb-3")}
        data-slot="attachment-tray"
      >
        {attachments.map((attachment) => {
          const isRemoving = removingAttachmentIds.has(attachment.id);
          const isUploadError = attachment.uploadStatus === "error";

          return (
            <div
              className={cn(
                "group relative flex origin-left overflow-visible transition-[width,max-width,opacity,transform] duration-150 ease-out data-[removing=true]:w-0 data-[removing=true]:max-w-0 data-[removing=true]:scale-x-0 data-[removing=true]:opacity-0",
                compact ? "w-max max-w-72" : "w-72 max-w-72"
              )}
              data-removing={isRemoving ? "true" : undefined}
              key={attachment.id}
            >
              <div
                aria-label={`Preview ${attachment.name}`}
                className={cn(
                  "flex min-w-0 flex-1 cursor-zoom-in items-center gap-2 overflow-hidden rounded-lg border bg-background px-2.5 py-2 text-foreground text-sm data-[removing=true]:border-transparent",
                  isUploadError && "border-destructive/40 bg-destructive/4"
                )}
                onDoubleClick={() => setPreviewAttachment(attachment)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setPreviewAttachment(attachment);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <AttachmentPreview attachment={attachment} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{attachment.name}</div>
                  <AttachmentMetadataLine attachment={attachment} />
                </div>
              </div>
              {!compact && (
                <Button
                  aria-label={`Remove ${attachment.name}`}
                  className={cn(
                    "-right-1.5 -top-1.5 pointer-events-none absolute z-10 rounded-full border bg-background opacity-0 shadow-xs transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                    isUploadError
                      ? "border-destructive/40! text-destructive hover:bg-destructive/8"
                      : "border-border! text-foreground"
                  )}
                  disabled={isRemoving}
                  onClick={() => handleRemove(attachment.id)}
                  size="icon-xs"
                  variant="ghost"
                >
                  <XIcon aria-hidden="true" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <AttachmentPreviewDialog
        attachment={previewAttachment}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAttachment(null);
          }
        }}
      />
    </>
  );
}

function AttachmentPreviewDialog({
  attachment,
  onOpenChange
}: {
  attachment: ChatAttachment | null;
  onOpenChange: (open: boolean) => void;
}): ReactElement {
  const FileTypeIcon = attachment ? getAttachmentFileIcon(attachment) : FileIcon;
  const hasImagePreview = attachment?.kind === "image" && Boolean(attachment.previewUrl);
  const hasTextPreview = Boolean(attachment?.previewText) && isTextPreviewAttachment(attachment);
  const previewState =
    attachment?.previewState ??
    (hasImagePreview || hasTextPreview ? "available" : "unsupported");

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(attachment)}>
      <DialogPopup className="max-w-3xl" closeProps={{ "aria-label": "Close preview" }}>
        <DialogHeader>
          <DialogTitle className="truncate">
            {attachment?.name ?? "Attachment preview"}
          </DialogTitle>
          {attachment && (
            <DialogDescription>
              {attachment.sizeLabel ?? attachment.mimeType ?? attachment.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogPanel className="pt-1">
          {hasImagePreview && attachment?.previewUrl ? (
            <img
              alt={attachment.name}
              className="max-h-[60vh] w-full rounded-xl border object-contain"
              src={attachment.previewUrl}
            />
          ) : hasTextPreview && attachment?.previewText ? (
            <HighlightedCodePreview attachment={attachment} />
          ) : previewState === "unknown" && attachment ? (
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                  <FileTypeIcon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="truncate font-medium">{attachment.name}</div>
                  <div className="text-muted-foreground text-sm">
                    Preview metadata is not available for this file yet.
                  </div>
                </div>
              </div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <AttachmentDetail label="Size" value={attachment.sizeLabel} />
                <AttachmentDetail label="Type" value={attachment.mimeType} />
                <AttachmentDetail
                  label="Source"
                  value={
                    attachment.source ? getAttachmentSourceLabel(attachment.source) : undefined
                  }
                />
                <AttachmentDetail label="Description" value={attachment.description} />
              </dl>
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border bg-muted/40 p-8 text-center">
              <span className="flex size-12 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                <FileTypeIcon aria-hidden="true" className="size-6" />
              </span>
              <div>
                <div className="font-medium">{attachment?.name}</div>
                <div className="mt-1 text-muted-foreground text-sm">
                  Preview is not available for this file type.
                </div>
              </div>
            </div>
          )}
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}

function HighlightedCodePreview({
  attachment
}: {
  attachment: ChatAttachment;
}): ReactElement {
  const highlightedCode = getHighlightedAttachmentCode(attachment);

  return (
    <ScrollArea className="max-h-[60vh] rounded-xl border bg-code">
      <pre
        className="whitespace-pre-wrap p-4 font-mono text-code-foreground text-xs leading-5"
        data-language={highlightedCode.languageLabel}
      >
        <code
          className="gp-code-preview"
          dangerouslySetInnerHTML={{ __html: highlightedCode.html }}
        />
      </pre>
    </ScrollArea>
  );
}

function AttachmentDetail({
  label,
  value
}: {
  label: string;
  value?: string;
}): ReactElement {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 truncate">{value ?? "Unavailable"}</dd>
    </div>
  );
}

function AttachmentPreview({
  attachment
}: {
  attachment: ChatAttachment;
}): ReactElement {
  if (attachment.kind === "image" && attachment.previewUrl) {
    return (
      <img
        alt=""
        className="size-8 shrink-0 rounded-md border object-cover"
        src={attachment.previewUrl}
      />
    );
  }

  const FileTypeIcon = getAttachmentFileIcon(attachment);

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/72 text-muted-foreground">
      <FileTypeIcon aria-hidden="true" className="size-4" />
    </span>
  );
}

function AttachmentMetadataLine({
  attachment
}: {
  attachment: ChatAttachment;
}): ReactElement {
  if (attachment.uploadStatus === "uploading") {
    const progress = Math.min(Math.max(attachment.uploadProgress ?? 0, 0), 100);

    return (
      <div className="mt-1 flex min-w-0 items-center gap-2 text-muted-foreground text-xs">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            aria-label={`Uploading ${attachment.name}`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="h-full rounded-full bg-info"
            role="progressbar"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 font-mono">{progress}%</span>
      </div>
    );
  }

  const statusLabel =
    attachment.uploadStatus === "error"
        ? (attachment.errorMessage ?? "Upload failed")
        : (attachment.sizeLabel ?? attachment.mimeType ?? attachment.description);

  return (
    <div
      className={cn(
        "mt-0.5 flex min-w-0 items-center gap-1.5 text-xs",
        attachment.uploadStatus === "error" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      <span className="truncate">{statusLabel}</span>
    </div>
  );
}

function getAttachmentSourceLabel(
  source: NonNullable<ChatAttachment["source"]>
): string {
  switch (source) {
    case "local-file":
      return "Local";
    case "project-file":
      return "Project";
    case "selected-context":
      return "Context";
  }
}

function isTextPreviewAttachment(attachment: ChatAttachment | null | undefined): boolean {
  if (!attachment) {
    return false;
  }

  const mimeType = attachment.mimeType ?? "";
  const fileName = attachment.name.toLowerCase();

  return (
    mimeType.startsWith("text/") ||
    mimeType.includes("markdown") ||
    mimeType.includes("json") ||
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    /\.(css|html|js|jsx|json|md|ts|tsx|txt)$/.test(fileName)
  );
}

function getHighlightedAttachmentCode(attachment: ChatAttachment): {
  html: string;
  languageLabel: string;
} {
  const previewText = attachment.previewText ?? "";
  const language = getAttachmentCodeLanguage(attachment);

  if (language && hljs.getLanguage(language)) {
    const highlighted = hljs.highlight(previewText, {
      ignoreIllegals: true,
      language
    });

    return {
      html: highlighted.value,
      languageLabel: language
    };
  }

  const highlighted = hljs.highlightAuto(previewText);

  return {
    html: highlighted.value,
    languageLabel: highlighted.language ?? "text"
  };
}

function getAttachmentCodeLanguage(attachment: ChatAttachment): string | null {
  const mimeType = attachment.mimeType ?? "";
  const fileName = attachment.name.toLowerCase();

  if (
    mimeType.includes("typescript") ||
    /\.(ts|tsx)$/.test(fileName)
  ) {
    return "typescript";
  }

  if (
    mimeType.includes("javascript") ||
    /\.(js|jsx|mjs|cjs)$/.test(fileName)
  ) {
    return "javascript";
  }

  if (mimeType.includes("json") || /\.json$/.test(fileName)) {
    return "json";
  }

  if (mimeType.includes("markdown") || /\.(md|mdx)$/.test(fileName)) {
    return "markdown";
  }

  if (mimeType.includes("css") || /\.css$/.test(fileName)) {
    return "css";
  }

  if (
    mimeType.includes("html") ||
    mimeType.includes("xml") ||
    /\.(html|svg|xml)$/.test(fileName)
  ) {
    return "xml";
  }

  if (/\.(bash|sh|zsh)$/.test(fileName)) {
    return "bash";
  }

  return null;
}

function getAttachmentFileIcon(attachment: ChatAttachment): typeof FileIcon {
  const mimeType = attachment.mimeType ?? "";
  const fileName = attachment.name.toLowerCase();

  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("typescript") ||
    /\.(css|html|js|jsx|json|ts|tsx)$/.test(fileName)
  ) {
    return FileCodeIcon;
  }

  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("markdown") ||
    mimeType.includes("pdf") ||
    /\.(md|pdf|txt)$/.test(fileName)
  ) {
    return FileTextIcon;
  }

  if (attachment.kind === "image") {
    return ImageIcon;
  }

  return FileIcon;
}

function StatusBadge({ status }: { status: ChatRunStatus }): ReactElement {
  const variant = getStatusVariant(status);

  return (
    <Badge size="sm" variant={variant}>
      {status}
    </Badge>
  );
}

function StatusDot({ status }: { status: ChatRunStatus }): ReactElement {
  const dotClass =
    status === "complete"
      ? "bg-success"
      : status === "error" || status === "cancelled"
        ? "bg-destructive"
        : status === "running" || status === "working"
          ? "bg-info"
          : "bg-muted-foreground/40";

  return <span aria-label={status} className={cn("size-2 rounded-full", dotClass)} />;
}

function getStatusVariant(
  status: ChatRunStatus
): "destructive" | "error" | "info" | "outline" | "success" | "warning" {
  switch (status) {
    case "complete":
      return "success";
    case "error":
      return "error";
    case "cancelled":
      return "warning";
    case "running":
    case "working":
      return "info";
    case "queued":
      return "outline";
    default:
      return assertNever(status);
  }
}

function VerificationStatusBadge({
  status
}: {
  status: VerificationPipelineStatus;
}): ReactElement {
  return (
    <Badge size="sm" variant={getVerificationStatusVariant(status)}>
      {formatBadgeLabel(status)}
    </Badge>
  );
}

function VerificationCheckBadge({
  status
}: {
  status: VerificationCheckStatus;
}): ReactElement {
  return (
    <Badge size="sm" variant={getVerificationCheckVariant(status)}>
      {formatBadgeLabel(status)}
    </Badge>
  );
}

function formatBadgeLabel(value: string): string {
  const label = value.replace(/-/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function VerificationCheckIcon({
  status
}: {
  status: VerificationCheckStatus;
}): ReactElement {
  if (status === "passed") {
    return <CircleCheckIcon aria-hidden="true" className="size-4 text-success-foreground" />;
  }

  if (status === "failed") {
    return <CircleAlertIcon aria-hidden="true" className="size-4 text-destructive" />;
  }

  if (status === "running") {
    return <ClockIcon aria-hidden="true" className="size-4 text-info-foreground" />;
  }

  return <CircleDotIcon aria-hidden="true" className="size-4 text-muted-foreground" />;
}

function getVerificationStatusVariant(
  status: VerificationPipelineStatus
): "error" | "info" | "outline" | "success" | "warning" {
  switch (status) {
    case "passed":
      return "success";
    case "failed":
      return "error";
    case "blocked":
      return "warning";
    case "running":
      return "info";
    case "queued":
      return "outline";
    default:
      return assertNever(status);
  }
}

function getVerificationCheckVariant(
  status: VerificationCheckStatus
): "error" | "info" | "outline" | "success" | "warning" {
  switch (status) {
    case "passed":
      return "success";
    case "failed":
      return "error";
    case "running":
      return "info";
    case "skipped":
      return "warning";
    case "queued":
      return "outline";
    default:
      return assertNever(status);
  }
}

function getChangeImpactVariant(
  impact: Extract<ChatItem, { kind: "change-summary" }>["files"][number]["impact"]
): BadgeProps["variant"] {
  switch (impact) {
    case "high":
      return "warning";
    case "medium":
      return "info";
    case "low":
      return "outline";
    default:
      return assertNever(impact);
  }
}

function getChangeRecoveryLabel(
  kind: Extract<ChatItem, { kind: "change-recovery" }>["recovery"]["kind"]
): string {
  switch (kind) {
    case "checkpoint-missing":
      return "missing";
    case "conflict":
      return "conflict";
    case "revert-failed":
      return "revert failed";
    case "unmergeable":
      return "unmergeable";
    default:
      return assertNever(kind);
  }
}

function getGitHubNextActionLabel(
  action: Extract<Extract<ChatItem, { kind: "github-automation-ready" }>["nextAction"], string>
): string {
  switch (action) {
    case "commit":
      return "Commit changes";
    case "open-pr":
      return "Open PR";
    case "push":
      return "Push to GitHub";
    default:
      return assertNever(action);
  }
}

function formatGitHubAutomationSummary(summary: string): string {
  return summary.replace("after approval", "after manual approval");
}

function getRecoveryTone(
  state: ChatRecoveryItem["state"]
): { icon: string } {
  switch (state) {
    case "aborted":
      return { icon: "text-warning" };
    case "failed":
      return { icon: "text-destructive" };
    case "resumed":
      return { icon: "text-success" };
    case "stopped":
      return { icon: "text-muted-foreground" };
    default:
      return assertNever(state);
  }
}

function getToolIcon(toolName: ChatToolActionItem["toolName"]): ReactElement {
  switch (toolName) {
    case "bash":
      return <TerminalIcon aria-hidden="true" />;
    case "read":
    case "write":
    case "edit":
      return <FileIcon aria-hidden="true" />;
    case "find":
    case "grep":
      return <SearchIcon aria-hidden="true" />;
    case "ls":
      return <CircleDotIcon aria-hidden="true" />;
    case "runtime":
      return <BracesIcon aria-hidden="true" />;
    default:
      return assertNever(toolName);
  }
}

function getProviderBarColor(index: number): string {
  const colors = ["bg-info", "bg-success", "bg-warning", "bg-muted-foreground"];
  return colors[index] ?? "bg-muted-foreground";
}

function formatSessionCost(cost: number, billingLabel?: string): string {
  const base = `$${cost.toFixed(2)}`;
  return billingLabel ? `${base} (${billingLabel})` : base;
}

function formatTokenCount(tokens: number): string {
  return new Intl.NumberFormat("en-US").format(tokens);
}

function formatCompactTokenCount(tokens: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0
  });
  const units = [
    { suffix: "T", value: 1_000_000_000_000 },
    { suffix: "B", value: 1_000_000_000 },
    { suffix: "M", value: 1_000_000 },
    { suffix: "K", value: 1_000 }
  ];
  const unit = units.find(({ value }) => Math.abs(tokens) >= value);

  if (!unit) {
    return formatTokenCount(tokens);
  }

  return `${formatter.format(tokens / unit.value)}${unit.suffix}`;
}

function getSessionTokenCount(metrics: ChatSessionMetrics): number {
  if (typeof metrics.tokens === "number") {
    return metrics.tokens;
  }

  return (metrics.compactions ?? []).reduce(
    (sessionTotal, compaction) =>
      sessionTotal +
      compaction.providerCosts.reduce(
        (compactionTotal, providerCost) => compactionTotal + (providerCost.tokens ?? 0),
        0
      ),
    0
  );
}

function getSessionBillingLabel(metrics: ChatSessionMetrics): string | undefined {
  const billingSources = metrics.billingSources ?? [];

  if (billingSources.length === 0) {
    return metrics.billingLabel;
  }

  const uniqueSources = new Set(billingSources);

  if (uniqueSources.size > 1) {
    return "mix";
  }

  return uniqueSources.has("api") ? "API" : "sub";
}

function assertNever(value: never): never {
  throw new Error(`Unhandled chat value: ${JSON.stringify(value)}`);
}

export function ChatStatusLegend(): ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {(["queued", "running", "working", "complete", "error", "cancelled"] as ChatRunStatus[]).map(
        (status) => (
          <StatusBadge key={status} status={status} />
        )
      )}
    </div>
  );
}

export function ChatIconLegend(): ReactElement {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {[
        ["Complete", <CircleCheckIcon aria-hidden="true" key="complete" />],
        ["Warning or cancelled", <CircleAlertIcon aria-hidden="true" key="warning" />],
        ["Queued", <ClockIcon aria-hidden="true" key="clock" />],
        ["Selected", <CheckIcon aria-hidden="true" key="check" />]
      ].map(([label, icon]) => (
        <div
          className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm"
          key={String(label)}
        >
          {icon}
          {label}
        </div>
      ))}
    </div>
  );
}
