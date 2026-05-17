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
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  MessagesSquareIcon,
  PaperclipIcon,
  PanelLeftCloseIcon,
  ScissorsIcon,
  SearchIcon,
  SparklesIcon,
  TerminalIcon,
  XIcon
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement
} from "react";
import { Badge, type BadgeProps } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle
} from "@renderer/components/ui/card";
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
  ChatRunStatus,
  ChatSessionMetrics,
  ChatSubagent,
  ChatThinkingItem,
  ChatToken,
  ChatToolActionItem
} from "@shared/chat";

export interface ChatBodyProps {
  attachments?: ChatAttachment[];
  chatTitle?: string;
  commands?: ChatCommandOption[];
  composerDraft?: string;
  composerMode?: "default" | "mention" | "slash";
  composerPlanMode?: boolean;
  composerRunStatus?: ChatComposerRunStatus;
  items: ChatItem[];
  mentions?: ChatMentionOption[];
  metrics: ChatSessionMetrics;
  onChatTitleRename?: (name: string) => void;
  onCompact?: () => void;
  onComposerSubmit?: (
    payload: ChatComposerSubmitPayload
  ) => ChatComposerSubmitResult | Promise<ChatComposerSubmitResult | void> | void;
  onStopRun?: () => Promise<void> | void;
  onToggleSidebar?: () => void;
  selectedTokens?: ChatToken[];
}

export interface ChatComposerSubmitPayload {
  attachments: ChatAttachment[];
  intent?: "queue" | "send" | "steer";
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
  {
    description: "Renderer shell source file",
    id: "app-frame",
    kind: "file",
    label: "app-frame.tsx",
    path: "src/renderer/surfaces/app-frame.tsx"
  },
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
    previewUrl: CHAT_HEADER_PREVIEW_URL,
    sizeLabel: "412 KB"
  },
  {
    description: "Implementation notes",
    id: "session-plan",
    kind: "file",
    mimeType: "text/markdown",
    name: "session-plan.md",
    sizeLabel: "18 KB"
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
  items,
  mentions = CHAT_BODY_MENTIONS,
  metrics,
  onChatTitleRename,
  onCompact,
  onComposerSubmit,
  onStopRun,
  onToggleSidebar,
  selectedTokens = []
}: ChatBodyProps): ReactElement {
  return (
    <section className="flex min-h-screen flex-col bg-background text-foreground">
      <ChatHeaderMetrics
        chatTitle={chatTitle}
        metrics={metrics}
        onChatTitleRename={onChatTitleRename}
        onCompact={onCompact}
        onToggleSidebar={onToggleSidebar}
      />
      <ChatTranscript items={items} />
      <div className="border-t bg-background px-6 py-4">
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

export function ChatTranscript({ items }: { items: ChatItem[] }): ReactElement {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        {items.map((item) => (
          <ChatItemRow item={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}

function ChatItemRow({ item }: { item: ChatItem }): ReactElement {
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

export function ToolActionFrame({
  item
}: {
  item: ChatToolActionItem;
}): ReactElement {
  return (
    <Frame className="mx-auto w-full max-w-4xl">
      <FrameHeader className="flex-row items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-md border bg-background">
            {getToolIcon(item.toolName)}
          </div>
          <div className="min-w-0">
            <FrameTitle className="truncate">
              <span className="font-semibold text-foreground">{item.toolName}</span>
              <span className="ml-2 font-normal text-muted-foreground">
                {item.commandLabel ?? item.title}
              </span>
            </FrameTitle>
            <FrameDescription className="truncate">{item.summary}</FrameDescription>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </FrameHeader>
      {(item.detail || item.path || item.truncated || item.costLabel) && (
        <FrameFooter className="flex items-center justify-between gap-3 px-4 py-3 text-muted-foreground text-xs">
          <div className="min-w-0 truncate">
            {item.path ?? item.detail}
            {item.truncated && <span className="ml-2">(truncated)</span>}
          </div>
          {item.costLabel && <span className="font-mono">{item.costLabel}</span>}
        </FrameFooter>
      )}
    </Frame>
  );
}

export function ThinkingPanel({ item }: { item: ChatThinkingItem }): ReactElement {
  const [open, setOpen] = useState(Boolean(item.defaultOpen));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Frame className="mx-auto w-full max-w-4xl">
        <CollapsibleTrigger className="w-full text-left">
          <FrameHeader className="flex-row items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {open ? (
                <ChevronDownIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              )}
              <SparklesIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              <div className="min-w-0">
                <FrameTitle>{item.title}</FrameTitle>
                <FrameDescription className="truncate">{item.summary}</FrameDescription>
              </div>
            </div>
            <StatusBadge status={item.status} />
          </FrameHeader>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <FramePanel className="mx-1 mb-1 p-4 text-muted-foreground text-sm leading-6">
            {item.detail}
            {item.costLabel && (
              <div className="mt-3 text-right font-mono text-xs">{item.costLabel}</div>
            )}
          </FramePanel>
        </CollapsiblePanel>
      </Frame>
    </Collapsible>
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
    <Card className="mx-auto w-full max-w-4xl overflow-hidden">
      <CardHeader className="grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge variant="info">{type}</Badge>
      </CardHeader>
      <CardPanel className="pt-0">
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
        <div className="mt-3">
          <StatusBadge status={status} />
        </div>
      </CardPanel>
    </Card>
  );
}

export function SubagentChainSurface({
  item
}: {
  item: Extract<ChatItem, { kind: "subagent-chain" }>;
}): ReactElement {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Frame className="mx-auto w-full max-w-4xl">
        <CollapsibleTrigger className="w-full text-left">
          <FrameHeader className="flex-row items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {open ? (
                <ChevronDownIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <FrameTitle>{item.title}</FrameTitle>
                {item.summary && (
                  <FrameDescription className="truncate">{item.summary}</FrameDescription>
                )}
              </div>
            </div>
            <StatusBadge status={item.status} />
          </FrameHeader>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <FramePanel className="mx-1 mb-1 p-0">
            <div className="divide-y">
              {item.agents.map((agent) => (
                <SubagentRow agent={agent} key={agent.id} />
              ))}
            </div>
          </FramePanel>
        </CollapsiblePanel>
      </Frame>
    </Collapsible>
  );
}

function SubagentRow({ agent }: { agent: ChatSubagent }): ReactElement {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
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
    </div>
  );
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
    <Frame className="mx-auto w-full max-w-4xl">
      <FrameHeader className="px-4 py-3">
        <FrameTitle>{item.title}</FrameTitle>
        <FrameDescription>{item.summaryType}</FrameDescription>
      </FrameHeader>
      <FramePanel className="mx-1 mb-1 p-4 text-sm leading-6">{item.content}</FramePanel>
    </Frame>
  );
}

function ErrorFrame({
  item
}: {
  item: Extract<ChatItem, { kind: "error" }>;
}): ReactElement {
  return (
    <Frame className="mx-auto w-full max-w-4xl">
      <FrameHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <CircleAlertIcon aria-hidden="true" className="size-4 text-destructive" />
          <FrameTitle>{item.title}</FrameTitle>
        </div>
        <FrameDescription>{item.message}</FrameDescription>
      </FrameHeader>
      {item.detail && <FrameFooter className="px-4 py-3 text-sm">{item.detail}</FrameFooter>}
    </Frame>
  );
}

export function ChatComposer({
  attachments = [],
  commands = CHAT_BODY_COMMANDS,
  draft = "",
  mentions = CHAT_BODY_MENTIONS,
  mode = "default",
  onSubmit,
  onStopRun,
  planMode = false,
  runStatus = "idle",
  selectedTokens = []
}: {
  attachments?: ChatAttachment[];
  commands?: ChatCommandOption[];
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
}): ReactElement {
  const [visibleAttachments, setVisibleAttachments] = useState(attachments);
  const [visibleSelectedTokens, setVisibleSelectedTokens] = useState(selectedTokens);
  const [draftText, setDraftText] = useState(draft);
  const [isPlanModeBadgeVisible, setIsPlanModeBadgeVisible] = useState(planMode);
  const [submitState, setSubmitState] = useState<"error" | "idle" | "submitting">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
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
        previewUrl,
        sizeLabel: formatFileSize(file.size)
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

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <InputGroup className="flex-col items-stretch">
        {activePicker && (
          <ComposerPickerFrame title={activePicker.title}>
            {activePicker.content}
          </ComposerPickerFrame>
        )}
        {visibleAttachments.length > 0 && (
          <InputGroupAddon
            align="block-start"
            className={cn(
              "border-b bg-muted/72",
              activePicker && "pt-0 [&>[data-slot=attachment-tray]]:pt-[calc(--spacing(3)-1px)]"
            )}
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
    <InputGroupAddon
      align="block-start"
      className="block cursor-default overflow-hidden rounded-t-[calc(var(--radius-lg)-1px)] border-b bg-popover p-0"
    >
      <FrameHeader className="rounded-t-[calc(var(--radius-lg)-1px)] bg-muted/72 px-3 py-2">
        <FrameTitle className="text-muted-foreground text-xs">{title}</FrameTitle>
      </FrameHeader>
      {children}
    </InputGroupAddon>
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
                className="flex min-w-0 flex-1 cursor-zoom-in items-center gap-2 overflow-hidden rounded-lg border bg-background px-2.5 py-2 text-sm data-[removing=true]:border-transparent"
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
                <div className="min-w-0">
                  <div className="truncate font-medium">{attachment.name}</div>
                  <div className="truncate text-muted-foreground text-xs">
                    {attachment.sizeLabel ?? attachment.mimeType ?? attachment.description}
                  </div>
                </div>
              </div>
              {!compact && (
                <Button
                  aria-label={`Remove ${attachment.name}`}
                  className="-right-1.5 -top-1.5 pointer-events-none absolute z-10 rounded-full border border-border! bg-background opacity-0 shadow-xs transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
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
          {attachment?.kind === "image" && attachment.previewUrl ? (
            <img
              alt={attachment.name}
              className="max-h-[60vh] w-full rounded-xl border object-contain"
              src={attachment.previewUrl}
            />
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
