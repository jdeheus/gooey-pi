import {
  ArrowUpIcon,
  BellIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  DatabaseIcon,
  FileTextIcon,
  FolderOpenIcon,
  InfoIcon,
  LoaderCircleIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  TriangleAlertIcon,
  XIcon
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { ChatBody, CHAT_BODY_DEFAULT_METRICS } from "@renderer/surfaces/chat-body";
import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle
} from "@renderer/components/ui/card";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle
} from "@renderer/components/ui/dialog";
import {
  Frame,
  FrameFooter,
  FramePanel
} from "@renderer/components/ui/frame";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger
} from "@renderer/components/ui/collapsible";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea
} from "@renderer/components/ui/input-group";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuSub,
  MenuSubPopup,
  MenuSubTrigger,
  MenuTrigger
} from "@renderer/components/ui/menu";
import { Separator } from "@renderer/components/ui/separator";
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger
} from "@renderer/components/ui/tooltip";
import type {
  PiModelCatalog,
  PiModelOption,
  PiModelProvider,
  PiModelThinkingLevel
} from "@shared/pi";
import type { ChatItem, ChatSessionMetrics } from "@shared/chat";
import { cn } from "@renderer/lib/utils";

export interface SidebarChat {
  id?: string;
  name: string;
  unread?: boolean;
  updatedSecondsAgo: number;
}

export interface SidebarProject {
  chats: SidebarChat[];
  name: string;
}

export interface SessionPanelStep {
  label: string;
  status: "complete" | "current" | "pending";
}

export interface DiagnosticsEvent {
  description: string;
  severity: "normal" | "warning" | "error";
  timeLabel: string;
  title: string;
}

export type AppFrameSurfaceKind =
  | "active"
  | "disconnected"
  | "empty"
  | "error"
  | "loading"
  | "project-invalid"
  | "project-restored"
  | "reconnecting"
  | "runtime-ready-no-project"
  | "runtime-starting"
  | "session-creating"
  | "unavailable";

export interface AppFrameActionHandlers {
  onActiveChatChange?: (chatId: string, chat: SidebarChat) => void;
  onClearDiagnostics?: () => void;
  onCopySessionInfo?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenProject?: () => void;
  onOpenSettings?: () => void;
  onReconnect?: () => void;
  onRetryRuntime?: () => void;
}

const THINKING_LEVEL_LABELS: Record<PiModelThinkingLevel, string> = {
  high: "high",
  low: "low",
  medium: "medium",
  minimal: "minimal",
  off: "off",
  xhigh: "extra high"
};

const STORYBOOK_DEFAULT_MODEL_VALUE = "openai-codex/gpt-5.5:medium";

const STORYBOOK_MODEL_CATALOG: PiModelCatalog = {
  defaultModelValue: STORYBOOK_DEFAULT_MODEL_VALUE,
  providers: [
    {
      id: "openai-codex",
      label: "OpenAI Codex",
      models: [
        {
          id: "gpt-5.2",
          label: "GPT-5.2",
          thinkingLevels: ["off", "minimal", "low", "medium", "high", "xhigh"]
        },
        {
          id: "gpt-5.4-mini",
          label: "GPT-5.4 Mini",
          thinkingLevels: ["off", "minimal", "low", "medium", "high", "xhigh"]
        },
        {
          id: "gpt-5.5",
          label: "GPT-5.5",
          thinkingLevels: ["off", "minimal", "low", "medium", "high", "xhigh"]
        }
      ]
    }
  ]
};

const SIDEBAR_PROJECTS: SidebarProject[] = [
  {
    chats: [
      { name: "Project setup", unread: true, updatedSecondsAgo: 28 },
      { name: "Renderer shell", updatedSecondsAgo: 7 * 60 },
      { name: "Coss primitives", unread: true, updatedSecondsAgo: 42 * 60 },
      { name: "Storybook coverage", updatedSecondsAgo: 2 * 60 * 60 },
      { name: "Electron startup", updatedSecondsAgo: 9 * 60 * 60 },
      { name: "Session planning", updatedSecondsAgo: 26 * 60 * 60 },
      { name: "Diagnostics", updatedSecondsAgo: 8 * 24 * 60 * 60 }
    ],
    name: "UI"
  }
];

const SESSION_PANEL_STEPS: SessionPanelStep[] = [
  { label: "Project context loaded", status: "complete" },
  { label: "Renderer shell review", status: "current" },
  { label: "Diagnostics handoff", status: "pending" }
];

const DIAGNOSTIC_EVENTS: DiagnosticsEvent[] = [
  {
    description: "Renderer surface mounted with mocked session fixtures.",
    severity: "normal",
    timeLabel: "now",
    title: "Session view ready"
  },
  {
    description: "Storybook is using sample project data for this surface.",
    severity: "warning",
    timeLabel: "2m ago",
    title: "Mocked data source"
  },
  {
    description: "No live Pi event stream is connected to this UI slice yet.",
    severity: "error",
    timeLabel: "5m ago",
    title: "Event stream unavailable"
  }
];

export interface AppFrameProps {
  activeChatId?: string | null;
  activeChatName?: string | null;
  chatItems?: ChatItem[];
  chatMetrics?: ChatSessionMetrics;
  diagnosticsEvents?: DiagnosticsEvent[];
  hasProjects?: boolean;
  initialNavQuery?: string;
  isRefreshing?: boolean;
  onClearDiagnostics?: () => void;
  onActiveChatChange?: (chatId: string, chat: SidebarChat) => void;
  onCopySessionInfo?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenProject?: () => void;
  onOpenSettings?: () => void;
  onReconnect?: () => void;
  onRetryRuntime?: () => void;
  modelCatalog?: PiModelCatalog | null;
  projectName: string;
  runtimeLabel?: string;
  runtimeStatus: "ready" | "not-ready" | "running";
  sessionSteps?: SessionPanelStep[];
  sessionStatus: string;
  sidebarProjects?: SidebarProject[];
  surface?: AppFrameSurfaceKind;
}

export function AppFrame({
  activeChatId: activeChatIdProp,
  activeChatName: activeChatNameProp,
  chatItems,
  chatMetrics,
  diagnosticsEvents = DIAGNOSTIC_EVENTS,
  hasProjects = false,
  initialNavQuery = "",
  isRefreshing = false,
  modelCatalog,
  onActiveChatChange,
  onClearDiagnostics,
  onCopySessionInfo,
  onOpenDiagnostics,
  onOpenProject,
  onOpenSettings,
  onReconnect,
  onRetryRuntime,
  projectName,
  runtimeLabel: runtimeLabelProp,
  runtimeStatus,
  sessionSteps = SESSION_PANEL_STEPS,
  sessionStatus,
  sidebarProjects = SIDEBAR_PROJECTS,
  surface
}: AppFrameProps): ReactElement {
  const [internalActiveChatId, setInternalActiveChatId] = useState<
    string | null | undefined
  >(activeChatIdProp);
  const [navQuery, setNavQuery] = useState(initialNavQuery);
  useEffect(() => {
    setInternalActiveChatId(activeChatIdProp);
  }, [activeChatIdProp]);

  const hasProjectSelected =
    hasProjects && projectName.trim() !== "" && projectName !== "No project selected";
  const runtimeLabel =
    runtimeLabelProp ??
    (runtimeStatus === "ready"
      ? "Renderer ready"
      : runtimeStatus === "running"
        ? "Session running"
        : "Setup needed");
  const surfaceKind = surface ?? (hasProjectSelected ? "active" : "empty");
  const selectedProject = sidebarProjects.find(
    (project) => project.name === projectName
  );
  const effectiveActiveChatId =
    activeChatIdProp === undefined ? internalActiveChatId : activeChatIdProp;
  const activeChat = resolveActiveSidebarChat({
    activeChatId: effectiveActiveChatId,
    activeChatName: activeChatNameProp,
    project: selectedProject,
    surface: surfaceKind
  });
  const activeChatId = activeChat && selectedProject
    ? getSidebarChatId(selectedProject, activeChat)
    : undefined;
  const activeChatName = activeChat?.name;
  const filteredProjects = useMemo(() => {
    const normalizedQuery = navQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return sidebarProjects;
    }

    return sidebarProjects.map((project) => {
      const projectMatches = project.name.toLowerCase().includes(normalizedQuery);
      const chats = projectMatches
        ? project.chats
        : project.chats.filter((chat) =>
            chat.name.toLowerCase().includes(normalizedQuery)
          );

      return { ...project, chats };
    }).filter((project) => project.chats.length > 0);
  }, [navQuery, sidebarProjects]);
  const handleSelectChat = (project: SidebarProject, chat: SidebarChat): void => {
    const nextChatId = getSidebarChatId(project, chat);

    if (activeChatIdProp === undefined) {
      setInternalActiveChatId(nextChatId);
    }

    onActiveChatChange?.(nextChatId, chat);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
          <SidebarHeader
            hasProjects={hasProjects}
            navQuery={navQuery}
            onNavQueryChange={setNavQuery}
            onNewProject={onOpenProject}
          />
          <div className="flex min-h-0 flex-1 flex-col p-3">
            {hasProjects ? (
              <nav aria-label="Sidebar navigation" className="flex flex-1 flex-col">
                {filteredProjects.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {filteredProjects.map((project) => (
                      <SidebarProjectGroup
                        activeChatId={activeChatId}
                        activeChatName={activeChatName}
                        key={project.name}
                        onChatSelect={handleSelectChat}
                        project={project}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    aria-live="polite"
                    className="flex flex-1 items-center justify-center px-3 text-center text-muted-foreground text-sm"
                  >
                    No navigation items found.
                  </div>
                )}
              </nav>
            ) : (
              <div className="flex flex-1 items-center justify-center px-3 text-center">
                <div className="max-w-36">
                  <div className="font-medium text-sm">No projects yet</div>
                  <div className="mt-1 text-muted-foreground text-xs leading-5">
                    Once a project is added, it will show up here.
                  </div>
                </div>
              </div>
            )}
          </div>
          <SidebarFooter
            onCopySessionInfo={onCopySessionInfo}
            onOpenDiagnostics={onOpenDiagnostics}
            onOpenSettings={onOpenSettings}
            onReconnect={onReconnect}
            runtimeLabel={runtimeLabel}
            runtimeStatus={runtimeStatus}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <AppFrameMainSurface
            activeChatName={activeChatName}
            chatItems={chatItems}
            chatMetrics={chatMetrics}
            diagnosticsEvents={diagnosticsEvents}
            isRefreshing={isRefreshing}
            modelCatalog={modelCatalog}
            onClearDiagnostics={onClearDiagnostics}
            onOpenProject={onOpenProject}
            onReconnect={onReconnect}
            onRetryRuntime={onRetryRuntime}
            projectName={projectName}
            runtimeLabel={runtimeLabel}
            runtimeStatus={runtimeStatus}
            sessionStatus={sessionStatus}
            sidebarProjects={sidebarProjects}
            steps={sessionSteps}
            surface={surfaceKind}
          />
        </section>
      </div>
    </main>
  );
}

function AppFrameMainSurface({
  activeChatName,
  chatItems,
  chatMetrics,
  diagnosticsEvents,
  isRefreshing,
  modelCatalog,
  onClearDiagnostics,
  onOpenProject,
  onReconnect,
  onRetryRuntime,
  projectName,
  runtimeLabel,
  runtimeStatus,
  sessionStatus,
  sidebarProjects,
  steps,
  surface
}: {
  activeChatName?: string;
  chatItems?: ChatItem[];
  chatMetrics?: ChatSessionMetrics;
  diagnosticsEvents: DiagnosticsEvent[];
  isRefreshing: boolean;
  modelCatalog?: PiModelCatalog | null;
  onClearDiagnostics?: () => void;
  onOpenProject?: () => void;
  onReconnect?: () => void;
  onRetryRuntime?: () => void;
  projectName: string;
  runtimeLabel: string;
  runtimeStatus: AppFrameProps["runtimeStatus"];
  sessionStatus: string;
  sidebarProjects: SidebarProject[];
  steps: SessionPanelStep[];
  surface: AppFrameSurfaceKind;
}): ReactElement {
  if (surface === "active") {
    return (
      <ChatBody
        items={
          chatItems?.length
            ? chatItems
            : [
                {
                  content: "Session is active. New Pi events will appear here.",
                  id: "active-placeholder",
                  kind: "summary",
                  summaryType: "branch",
                  title: "Active session"
                }
              ]
        }
        metrics={chatMetrics ?? (runtimeStatus === "running" ? CHAT_BODY_DEFAULT_METRICS : {
          ...CHAT_BODY_DEFAULT_METRICS,
          isUnavailable: true
        })}
        chatTitle={activeChatName}
      />
    );
  }

  if (surface === "empty" || surface === "runtime-ready-no-project") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyProjectSurface
          modelCatalog={modelCatalog}
          onOpenProject={onOpenProject}
          projectName={projectName}
          sidebarProjects={sidebarProjects}
        />
      </div>
    );
  }

  if (surface === "loading" || surface === "runtime-starting" || surface === "session-creating" || isRefreshing) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LoaderCircleIcon
                aria-hidden="true"
                className="size-4 animate-spin text-muted-foreground"
              />
              <CardTitle>
                {surface === "session-creating" ? "Creating session" : "Starting renderer"}
              </CardTitle>
            </div>
            <CardDescription>
              Loading project, runtime, session, and event stream state through the preload bridge.
            </CardDescription>
          </CardHeader>
          <CardPanel className="space-y-3">
            {[
              "Project folder state",
              "Pi runtime state",
              "Session snapshot",
              "Event stream snapshot"
            ].map((label, index) => (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/60 p-3" key={label}>
                <span
                  className={[
                    "flex size-6 items-center justify-center rounded-full border",
                    index === 0 ? "border-success/30 text-success-foreground" : "border-info/30 text-info-foreground"
                  ].join(" ")}
                >
                  {index === 0 ? (
                    <CheckIcon aria-hidden="true" className="size-4" />
                  ) : (
                    <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />
                  )}
                </span>
                <span className="font-medium text-sm">{label}</span>
              </div>
            ))}
          </CardPanel>
        </Card>
      </div>
    );
  }

  if (surface === "project-restored") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <SessionPanel
            projectName={projectName}
            sessionStatus={sessionStatus}
            steps={steps}
          />
          <DiagnosticsEventSurface events={diagnosticsEvents} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <StateRecoverySurface
        diagnosticsEvents={diagnosticsEvents}
        onClearDiagnostics={onClearDiagnostics}
        onOpenProject={onOpenProject}
        onReconnect={onReconnect}
        onRetryRuntime={onRetryRuntime}
        runtimeLabel={runtimeLabel}
        runtimeStatus={runtimeStatus}
        surface={surface}
      />
    </div>
  );
}

function StateRecoverySurface({
  diagnosticsEvents,
  onClearDiagnostics,
  onOpenProject,
  onReconnect,
  onRetryRuntime,
  runtimeLabel,
  runtimeStatus,
  surface
}: {
  diagnosticsEvents: DiagnosticsEvent[];
  onClearDiagnostics?: () => void;
  onOpenProject?: () => void;
  onReconnect?: () => void;
  onRetryRuntime?: () => void;
  runtimeLabel: string;
  runtimeStatus: AppFrameProps["runtimeStatus"];
  surface: AppFrameSurfaceKind;
}): ReactElement {
  const copy = getRecoverySurfaceCopy(surface);
  const Icon = copy.variant === "error" ? CircleAlertIcon : TriangleAlertIcon;

  return (
    <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex items-start gap-3">
            <span
              className={[
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                copy.variant === "error"
                  ? "bg-destructive/8 text-destructive-foreground"
                  : "bg-warning/8 text-warning-foreground"
              ].join(" ")}
            >
              <Icon aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <CardTitle>{copy.title}</CardTitle>
              <CardDescription>{copy.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardPanel className="flex flex-wrap items-center gap-2">
          <Badge variant={copy.variant}>{runtimeLabel}</Badge>
          <Button onClick={onRetryRuntime} variant="outline">Retry</Button>
          <Button onClick={onReconnect} variant="outline">Reconnect</Button>
          {surface === "project-invalid" && (
            <Button onClick={onOpenProject}>Choose project</Button>
          )}
          {runtimeStatus === "not-ready" && (
            <Button onClick={onClearDiagnostics} variant="ghost">
              Clear diagnostics
            </Button>
          )}
        </CardPanel>
      </Card>
      <DiagnosticsEventSurface events={diagnosticsEvents} />
    </div>
  );
}

function getRecoverySurfaceCopy(surface: AppFrameSurfaceKind): {
  description: string;
  title: string;
  variant: "error" | "warning";
} {
  if (surface === "disconnected") {
    return {
      description:
        "The renderer could not reach the preload bridge or the event stream is unavailable.",
      title: "Renderer disconnected",
      variant: "warning"
    };
  }

  if (surface === "project-invalid") {
    return {
      description:
        "The restored project path is no longer available or is not readable by the app.",
      title: "Project needs attention",
      variant: "warning"
    };
  }

  if (surface === "reconnecting") {
    return {
      description: "The renderer is refreshing project, runtime, session, and event state.",
      title: "Reconnect in progress",
      variant: "warning"
    };
  }

  if (surface === "unavailable") {
    return {
      description:
        "Pi runtime setup is not ready yet. Retry once the package is installed and available.",
      title: "Runtime unavailable",
      variant: "warning"
    };
  }

  return {
    description:
      "The runtime or session reported an error. Review diagnostics, then retry or reconnect.",
    title: "Runtime error",
    variant: "error"
  };
}

export function SidebarHeader({
  hasProjects,
  navQuery = "",
  onNavQueryChange,
  onNewProject
}: {
  hasProjects: boolean;
  navQuery?: string;
  onNavQueryChange?: (query: string) => void;
  onNewProject?: () => void;
}): ReactElement {
  return (
    <>
      <div className="p-3">
        <div className="flex h-8 items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <PanelLeftIcon aria-hidden="true" />
          </div>
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput
              aria-label="Filter sidebar navigation"
              disabled={!hasProjects}
              onChange={(event) => onNavQueryChange?.(event.target.value)}
              placeholder="Search"
              size="sm"
              type="search"
              value={navQuery}
            />
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            {navQuery.length > 0 && (
              <InputGroupAddon align="inline-end">
                <SearchClearButton
                  label="Clear sidebar search"
                  onClear={() => onNavQueryChange?.("")}
                />
              </InputGroupAddon>
            )}
          </InputGroup>
          <Button
            aria-label="New project"
            onClick={onNewProject}
            size="icon-sm"
            variant="ghost"
          >
            <PlusIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
      <Separator />
    </>
  );
}

export function SessionPanel({
  projectName,
  sessionStatus,
  steps
}: {
  projectName: string;
  sessionStatus: string;
  steps: SessionPanelStep[];
}): ReactElement {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Session</CardTitle>
            <CardDescription>
              Mocked session progress for {projectName}.
            </CardDescription>
          </div>
          <Badge variant="info">{sessionStatus}</Badge>
        </div>
      </CardHeader>
      <CardPanel className="space-y-4">
        <div className="rounded-lg border bg-muted p-3">
          <div className="text-muted-foreground text-xs">Current focus</div>
          <div className="mt-1 font-medium text-sm">Renderer surface review</div>
        </div>
        <div className="space-y-3">
          {steps.map((step) => (
            <div className="flex items-center gap-3" key={step.label}>
              <span
                className={[
                  "flex size-6 shrink-0 items-center justify-center rounded-full border",
                  step.status === "complete"
                    ? "border-success/30 bg-success/8 text-success-foreground"
                    : step.status === "current"
                      ? "border-info/30 bg-info/8 text-info-foreground"
                      : "border-border bg-background text-muted-foreground"
                ].join(" ")}
              >
                {step.status === "complete" ? (
                  <CircleCheckIcon aria-hidden="true" className="size-4" />
                ) : step.status === "current" ? (
                  <ClockIcon aria-hidden="true" className="size-4" />
                ) : (
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{step.label}</span>
            </div>
          ))}
        </div>
      </CardPanel>
    </Card>
  );
}

export function DiagnosticsEventSurface({
  events
}: {
  events: DiagnosticsEvent[];
}): ReactElement {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Diagnostics</CardTitle>
        <CardDescription>Renderer events shown with mocked fixtures.</CardDescription>
      </CardHeader>
      <CardPanel className="space-y-2">
        {events.map((event) => (
          <div
            className="flex gap-3 rounded-lg border bg-muted/60 p-3"
            key={`${event.title}-${event.timeLabel}`}
          >
            <span
              className={[
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                event.severity === "normal"
                  ? "bg-success/8 text-success-foreground"
                  : event.severity === "warning"
                    ? "bg-warning/8 text-warning-foreground"
                    : "bg-destructive/8 text-destructive-foreground"
              ].join(" ")}
            >
              {event.severity === "normal" ? (
                <InfoIcon aria-hidden="true" className="size-4" />
              ) : event.severity === "warning" ? (
                <TriangleAlertIcon aria-hidden="true" className="size-4" />
              ) : (
                <CircleAlertIcon aria-hidden="true" className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 truncate font-medium text-sm">
                  {event.title}
                </div>
                <div className="shrink-0 text-muted-foreground text-xs">
                  {event.timeLabel}
                </div>
              </div>
              <div className="mt-1 text-muted-foreground text-xs leading-5">
                {event.description}
              </div>
            </div>
          </div>
        ))}
      </CardPanel>
    </Card>
  );
}

function EmptyProjectSurface({
  modelCatalog,
  onOpenProject,
  projectName,
  sidebarProjects
}: {
  modelCatalog?: PiModelCatalog | null;
  onOpenProject?: () => void;
  projectName: string;
  sidebarProjects: SidebarProject[];
}): ReactElement {
  const resolvedModelCatalog = modelCatalog ?? STORYBOOK_MODEL_CATALOG;
  const defaultModelValue =
    resolvedModelCatalog.defaultModelValue ?? STORYBOOK_DEFAULT_MODEL_VALUE;
  const [selectedModel, setSelectedModel] = useState(defaultModelValue);

  useEffect(() => {
    setSelectedModel((currentModel) =>
      isModelValueAvailable(currentModel, resolvedModelCatalog.providers)
        ? currentModel
        : defaultModelValue
    );
  }, [defaultModelValue, resolvedModelCatalog]);
  const hasSelectedProject =
    projectName.trim() !== "" && projectName !== "No project selected";

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="text-center">
        <h1 className="mx-auto max-w-2xl truncate font-heading font-semibold text-3xl">
          {hasSelectedProject ? `Work in ${projectName}` : "Create a project"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm leading-6">
          What do you want to work on today?
        </p>
      </div>
      <Frame>
        <FramePanel className="p-0">
          <ProjectComposer
            className="border-0 shadow-none"
            modelCatalog={resolvedModelCatalog}
            onSelectModel={setSelectedModel}
            selectedModel={selectedModel}
          />
        </FramePanel>
        {hasSelectedProject && (
          <FrameFooter className="flex items-center justify-start px-3 py-2">
            <ProjectSelectMenu
              onAddProject={onOpenProject}
              projects={sidebarProjects}
              selectedProjectName={projectName}
            />
          </FrameFooter>
        )}
      </Frame>
      {!hasSelectedProject && <StatusCards onOpenProject={onOpenProject} />}
    </div>
  );
}

export function ProjectComposer({
  className,
  modelCatalog = STORYBOOK_MODEL_CATALOG,
  onSelectModel,
  selectedModel
}: {
  className?: string;
  modelCatalog?: PiModelCatalog;
  onSelectModel: (model: string) => void;
  selectedModel: string;
}): ReactElement {
  const contextInputRef = useRef<HTMLInputElement>(null);

  return (
    <InputGroup className={className}>
      <input
        aria-label="Attach project context file"
        className="sr-only"
        multiple
        onChange={(event) => {
          event.currentTarget.value = "";
        }}
        ref={contextInputRef}
        type="file"
      />
      <InputGroupTextarea
        aria-label="Describe a new project"
        placeholder="Describe the project you want to add..."
      />
      <InputGroupAddon align="block-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Attach project context"
                className="rounded-full"
                onClick={() => contextInputRef.current?.click()}
                size="icon-sm"
                variant="ghost"
              >
                <PlusIcon aria-hidden="true" />
              </Button>
            }
          />
          <TooltipPopup>Add project context</TooltipPopup>
        </Tooltip>
        <ModelMenu
          modelCatalog={modelCatalog}
          onSelectModel={onSelectModel}
          selectedModel={selectedModel}
        />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Create project"
                className="rounded-full"
                size="icon-sm"
              >
                <ArrowUpIcon aria-hidden="true" />
              </Button>
            }
          />
          <TooltipPopup>Create project</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  );
}

export function ProjectSelectMenu({
  initialOpen = false,
  initialQuery = "",
  onAddProject,
  projects,
  selectedProjectName
}: {
  initialOpen?: boolean;
  initialQuery?: string;
  onAddProject?: () => void;
  projects: SidebarProject[];
  selectedProjectName: string;
}): ReactElement {
  const [open, setOpen] = useState(initialOpen);
  const [query, setQuery] = useState(initialQuery);
  const searchRef = useRef<HTMLInputElement>(null);
  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter((project) =>
      project.name.toLowerCase().includes(normalizedQuery)
    );
  }, [projects, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const focusHandle = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusHandle);
  }, [open]);

  return (
    <Menu onOpenChange={setOpen} open={open}>
      <MenuTrigger
        render={
          <Button
            aria-label="Select project"
            className="max-w-64 rounded-full px-2.5 text-xs"
            size="sm"
            variant="ghost"
          >
            <span className="min-w-0 truncate">{selectedProjectName}</span>
            <ChevronDownIcon aria-hidden="true" />
          </Button>
        }
      />
      <MenuPopup align="end" className="min-w-72">
        <div className="sticky top-0 z-10 bg-popover p-1 pb-2">
          <InputGroup>
            <InputGroupInput
              aria-label="Search projects"
              onChange={(event) => setQuery(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder="Search projects"
              ref={searchRef}
              size="sm"
              type="search"
              value={query}
            />
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            {query.length > 0 && (
              <InputGroupAddon align="inline-end">
                <SearchClearButton
                  label="Clear project search"
                  onClear={() => setQuery("")}
                />
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Readable projects</MenuGroupLabel>
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => {
              const isSelected = project.name === selectedProjectName;
              const displayName = limitProjectSelectorName(project.name);

              return (
                <MenuItem closeOnClick key={project.name}>
                  <span className="flex size-4 items-center justify-center">
                    {isSelected && <CheckIcon aria-hidden="true" />}
                  </span>
                  <Tooltip>
                    <TooltipTrigger
                      render={<span className="min-w-0 flex-1 truncate" />}
                    >
                      {displayName}
                    </TooltipTrigger>
                    <TooltipPopup>{project.name}</TooltipPopup>
                  </Tooltip>
                </MenuItem>
              );
            })
          ) : (
            <div className="px-2 py-3 text-center text-muted-foreground text-sm">
              No projects found.
            </div>
          )}
        </MenuGroup>
        <MenuSeparator />
        <MenuItem closeOnClick onClick={onAddProject}>
          <FolderOpenIcon aria-hidden="true" />
          Open project
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}

function limitProjectSelectorName(name: string): string {
  return name.length > 30 ? `${name.slice(0, 27)}...` : name;
}

function getSidebarChatId(project: SidebarProject, chat: SidebarChat): string {
  return chat.id ?? `${project.name}:${chat.name}`;
}

function resolveActiveSidebarChat({
  activeChatId,
  activeChatName,
  project,
  surface
}: {
  activeChatId?: string | null;
  activeChatName?: string | null;
  project?: SidebarProject;
  surface: AppFrameSurfaceKind;
}): SidebarChat | undefined {
  if (!project || activeChatId === null || activeChatName === null) {
    return undefined;
  }

  if (activeChatId) {
    return project.chats.find(
      (chat) => getSidebarChatId(project, chat) === activeChatId
    );
  }

  if (activeChatName) {
    return project.chats.find((chat) => chat.name === activeChatName);
  }

  return surface === "active" ? project.chats[0] : undefined;
}

export function SidebarProjectGroup({
  activeChatId,
  activeChatName,
  defaultOpen = true,
  onChatSelect,
  project
}: {
  activeChatId?: string;
  activeChatName?: string;
  defaultOpen?: boolean;
  onChatSelect?: (project: SidebarProject, chat: SidebarChat) => void;
  project: SidebarProject;
}): ReactElement {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="group flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-primary outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background">
        <ChevronRightIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-primary/60 transition-transform group-data-panel-open:rotate-90"
        />
        <span className="min-w-0 flex-1 truncate font-semibold text-sm">
          {project.name}
        </span>
        <span className="text-muted-foreground text-sm tabular-nums">
          {project.chats.length}
        </span>
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="mt-2 flex flex-col gap-1 pl-6">
          {project.chats.map((chat) => {
            const chatId = getSidebarChatId(project, chat);
            const isActive = activeChatId
              ? chatId === activeChatId
              : chat.name === activeChatName;

            return (
              <Button
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "h-auto justify-start px-2 py-6 text-muted-foreground",
                  isActive && "text-foreground"
                )}
                key={chatId}
                onClick={() => onChatSelect?.(project, chat)}
                variant={isActive ? "secondary" : "ghost"}
              >
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate">{chat.name}</span>
                  <span className="block truncate text-muted-foreground/70 text-xs">
                    {formatRelativeTimestamp(chat.updatedSecondsAgo)}
                  </span>
                </span>
                {chat.unread && !isActive && (
                  <span
                    aria-label="Unread activity"
                    className="ml-auto size-2 shrink-0 rounded-full bg-info"
                  />
                )}
              </Button>
            );
          })}
        </div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

function formatRelativeTimestamp(secondsAgo: number): string {
  if (secondsAgo < 60) {
    return "a few seconds ago";
  }

  const minutes = Math.floor(secondsAgo / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);

  return `${weeks}w ago`;
}

export function StatusCards({
  onOpenProject
}: {
  onOpenProject?: () => void;
}): ReactElement {
  const projectInputRef = useRef<HTMLInputElement>(null);

  return (
    <CardPanel className="flex justify-center">
      <button
        className="w-full max-w-48 cursor-pointer rounded-lg border bg-muted p-3 text-left outline-none transition-[background-color,border-color,box-shadow] hover:border-ring/50 hover:bg-accent hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        onClick={() => {
          if (onOpenProject) {
            onOpenProject();
            return;
          }

          projectInputRef.current?.click();
        }}
        type="button"
      >
        <input
          aria-label="Open project"
          className="sr-only"
          onChange={(event) => {
            event.currentTarget.value = "";
          }}
          ref={projectInputRef}
          type="file"
          {...{ directory: "", webkitdirectory: "" }}
        />
        <div className="text-muted-foreground text-xs">Project</div>
        <div className="font-medium text-sm">Open project</div>
      </button>
    </CardPanel>
  );
}

export function ModelMenu({
  initialModelQuery = "",
  initialOpen = false,
  modelCatalog = STORYBOOK_MODEL_CATALOG,
  onSelectModel,
  selectedModel
}: {
  initialModelQuery?: string;
  initialOpen?: boolean;
  modelCatalog?: PiModelCatalog;
  onSelectModel: (model: string) => void;
  selectedModel: string;
}): ReactElement {
  const [menuOpen, setMenuOpen] = useState(initialOpen);
  const [modelQuery, setModelQuery] = useState(initialModelQuery);
  const modelSearchRef = useRef<HTMLInputElement>(null);
  const providers = modelCatalog.providers;
  const filteredProviders = useMemo(() => {
    const normalizedQuery = modelQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return providers;
    }

    return providers
      .map((provider) => {
        const providerMatches = provider.label
          .toLowerCase()
          .includes(normalizedQuery);
        const models = providerMatches
          ? provider.models
          : provider.models.filter((model) =>
              doesModelMatchQuery(model, normalizedQuery)
            );

        return { ...provider, models };
      })
      .filter((provider) => provider.models.length > 0);
  }, [modelQuery, providers]);
  const selectedOption = findSelectedModelOption(providers, selectedModel);
  const selectedModelOption = selectedOption?.model;
  const selectedThinkingLevel = selectedOption?.thinkingLevel;

  useEffect(() => {
    if (!menuOpen) {
      setModelQuery("");
      return;
    }

    const focusHandle = window.requestAnimationFrame(() => {
      modelSearchRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusHandle);
    };
  }, [menuOpen]);

  return (
    <Menu onOpenChange={setMenuOpen} open={menuOpen}>
      <MenuTrigger
        render={
          <Button
            aria-label="Select model"
            className="ml-auto max-w-44 rounded-full px-2.5"
            size="sm"
            variant="ghost"
          >
            <span className="flex min-w-0 items-center gap-1">
              <span className="truncate">
                {selectedModelOption?.label ?? selectedModel}
              </span>
              {selectedThinkingLevel && (
                <span className="shrink-0 font-light text-muted-foreground">
                  {THINKING_LEVEL_LABELS[selectedThinkingLevel]}
                </span>
              )}
            </span>
            <ChevronDownIcon aria-hidden="true" />
          </Button>
        }
      />
      <MenuPopup align="end" className="min-w-64">
        <div className="sticky top-0 z-10 bg-popover p-1 pb-2">
          <InputGroup>
            <InputGroupInput
              aria-label="Search models"
              onChange={(event) => setModelQuery(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder="Search models"
              ref={modelSearchRef}
              size="sm"
              type="search"
              value={modelQuery}
            />
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            {modelQuery.length > 0 && (
              <InputGroupAddon align="inline-end">
                <SearchClearButton
                  label="Clear model search"
                  onClear={() => setModelQuery("")}
                />
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
        {filteredProviders.length > 0 ? (
          filteredProviders.map((provider) => (
            <MenuGroup key={provider.id}>
              <MenuGroupLabel>{provider.label}</MenuGroupLabel>
              {provider.models.map((model) => (
                <MenuSub key={model.id}>
                  <MenuSubTrigger>{model.label}</MenuSubTrigger>
                  <MenuSubPopup>
                    {model.thinkingLevels.map((thinkingLevel) => {
                      const modelValue = formatModelValue(
                        provider.id,
                        model.id,
                        thinkingLevel
                      );
                      const isSelected = selectedModel === modelValue;

                      return (
                        <MenuItem
                          aria-current={isSelected ? "true" : undefined}
                          closeOnClick
                          key={thinkingLevel}
                          onClick={() => onSelectModel(modelValue)}
                        >
                          <span className="flex size-4 items-center justify-center">
                            {isSelected && <CheckIcon aria-hidden="true" />}
                          </span>
                          {THINKING_LEVEL_LABELS[thinkingLevel]}
                        </MenuItem>
                      );
                    })}
                  </MenuSubPopup>
                </MenuSub>
              ))}
            </MenuGroup>
          ))
        ) : (
          <div
            aria-live="polite"
            className="px-2 py-3 text-center text-muted-foreground text-sm"
          >
            No models found.
          </div>
        )}
      </MenuPopup>
    </Menu>
  );
}

function SearchClearButton({
  label,
  onClear
}: {
  label: string;
  onClear: () => void;
}): ReactElement {
  return (
    <Button
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClear();
      }}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      size="icon-xs"
      type="button"
      variant="ghost"
    >
      <XIcon aria-hidden="true" />
    </Button>
  );
}

function formatModelValue(
  providerId: string,
  modelId: string,
  thinkingLevel: PiModelThinkingLevel
): string {
  return `${providerId}/${modelId}:${thinkingLevel}`;
}

function findSelectedModelOption(
  providers: PiModelProvider[],
  selectedModel: string
):
  | {
      model: PiModelOption;
      thinkingLevel: PiModelThinkingLevel;
    }
  | undefined {
  for (const provider of providers) {
    for (const model of provider.models) {
      const thinkingLevel = model.thinkingLevels.find(
        (level) => selectedModel === formatModelValue(provider.id, model.id, level)
      );

      if (thinkingLevel) {
        return { model, thinkingLevel };
      }
    }
  }

  return undefined;
}

function isModelValueAvailable(
  selectedModel: string,
  providers: PiModelProvider[]
): boolean {
  return findSelectedModelOption(providers, selectedModel) !== undefined;
}

function doesModelMatchQuery(
  model: PiModelOption,
  normalizedQuery: string
): boolean {
  const searchableValues = [
    model.id,
    model.label,
    ...model.thinkingLevels.map((level) => THINKING_LEVEL_LABELS[level])
  ];

  return searchableValues.some((value) =>
    value.toLowerCase().includes(normalizedQuery)
  );
}

export function SidebarFooter({
  initialMenuOpen = false,
  onCopySessionInfo,
  onOpenDiagnostics,
  onOpenSettings,
  onReconnect,
  runtimeLabel,
  runtimeStatus
}: {
  initialMenuOpen?: boolean;
  onCopySessionInfo?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenSettings?: () => void;
  onReconnect?: () => void;
  runtimeLabel: string;
  runtimeStatus: AppFrameProps["runtimeStatus"];
}): ReactElement {
  const canReconnect = runtimeStatus === "not-ready";
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <footer className="mt-3 border-t px-3 py-3">
      <div className="flex items-center justify-end gap-2 px-2">
        <Menu defaultOpen={initialMenuOpen}>
          <MenuTrigger
            render={
              <Button aria-label="Renderer settings" size="icon-sm" variant="ghost">
                <SettingsIcon aria-hidden="true" />
              </Button>
            }
          />
          <MenuPopup align="end" className="min-w-56" side="top">
            <MenuGroup>
              <MenuGroupLabel>Renderer</MenuGroupLabel>
              <div className="px-2 py-1.5">
                <div className="text-muted-foreground text-xs">Status</div>
                <div className="mt-1">
                  <RuntimeStatusBadge
                    runtimeLabel={runtimeLabel}
                    runtimeStatus={runtimeStatus}
                  />
                </div>
              </div>
            </MenuGroup>
            <MenuSeparator />
            <MenuItem closeOnClick onClick={onOpenDiagnostics}>
              <InfoIcon aria-hidden="true" />
              Open diagnostics
            </MenuItem>
            <MenuItem closeOnClick disabled={!canReconnect} onClick={onReconnect}>
              <TriangleAlertIcon aria-hidden="true" />
              Reconnect renderer
            </MenuItem>
            <MenuItem closeOnClick onClick={onCopySessionInfo}>
              <ClockIcon aria-hidden="true" />
              Copy session info
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              closeOnClick
              onClick={() => {
                onOpenSettings?.();
                setSettingsOpen(true);
              }}
            >
              <SettingsIcon aria-hidden="true" />
              Open settings
            </MenuItem>
            <MenuItem closeOnClick>
              <CircleCheckIcon aria-hidden="true" />
              About renderer
            </MenuItem>
          </MenuPopup>
        </Menu>
      </div>
      <RendererSettingsDialog
        onOpenChange={setSettingsOpen}
        open={settingsOpen}
        runtimeLabel={runtimeLabel}
        runtimeStatus={runtimeStatus}
      />
    </footer>
  );
}

type SettingsSectionId = "general" | "projects" | "runtime" | "diagnostics" | "about";

const SETTINGS_SECTIONS: Array<{
  description: string;
  icon: typeof SettingsIcon;
  id: SettingsSectionId;
  label: string;
}> = [
  {
    description: "Startup and shell behavior",
    icon: SlidersHorizontalIcon,
    id: "general",
    label: "General"
  },
  {
    description: "Project restore and folders",
    icon: FolderOpenIcon,
    id: "projects",
    label: "Projects"
  },
  {
    description: "Pi runtime and models",
    icon: DatabaseIcon,
    id: "runtime",
    label: "Runtime"
  },
  {
    description: "Events and notices",
    icon: BellIcon,
    id: "diagnostics",
    label: "Diagnostics"
  },
  {
    description: "Versions and support",
    icon: FileTextIcon,
    id: "about",
    label: "About"
  }
];

export function RendererSettingsDialog({
  defaultSection = "general",
  onOpenChange,
  open,
  runtimeLabel,
  runtimeStatus
}: {
  defaultSection?: SettingsSectionId;
  onOpenChange?: (open: boolean) => void;
  open: boolean;
  runtimeLabel: string;
  runtimeStatus: AppFrameProps["runtimeStatus"];
}): ReactElement {
  const [section, setSection] = useState<SettingsSectionId>(defaultSection);
  const activeSection = SETTINGS_SECTIONS.find((item) => item.id === section) ?? SETTINGS_SECTIONS[0];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="max-w-3xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>Renderer settings</DialogTitle>
          <DialogDescription>
            Configure project restore, runtime behavior, diagnostics, and renderer preferences.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="grid gap-0 p-0 sm:grid-cols-[15rem_minmax(0,1fr)]" scrollFade={false}>
          <nav
            aria-label="Settings sections"
            className="border-b p-3 sm:border-r sm:border-b-0"
          >
            <div className="flex flex-col gap-1">
              {SETTINGS_SECTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = item.id === section;

                return (
                  <button
                    aria-current={isSelected ? "page" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                      isSelected && "bg-accent text-accent-foreground"
                    )}
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    type="button"
                  >
                    <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-medium text-sm">{item.label}</span>
                      <span className="block text-muted-foreground text-xs leading-5">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
          <section className="min-w-0 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-heading font-semibold text-lg">
                  {activeSection.label}
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  {activeSection.description}
                </p>
              </div>
              <RuntimeStatusBadge
                runtimeLabel={runtimeLabel}
                runtimeStatus={runtimeStatus}
              />
            </div>
            <Separator className="my-4" />
            <SettingsSectionBody
              runtimeLabel={runtimeLabel}
              runtimeStatus={runtimeStatus}
              section={section}
            />
          </section>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}

function SettingsSectionBody({
  runtimeLabel,
  runtimeStatus,
  section
}: {
  runtimeLabel: string;
  runtimeStatus: AppFrameProps["runtimeStatus"];
  section: SettingsSectionId;
}): ReactElement {
  if (section === "projects") {
    return (
      <div className="space-y-3">
        <SettingsRow
          description="Restore the last readable project on launch."
          label="Auto-restore project"
          value="Enabled"
        />
        <SettingsRow
          description="Project folder selection is handled through the typed preload API."
          label="Project picker"
          value="Folder only"
        />
        <SettingsRow
          description="Unread chats and timestamps are shown in the sidebar project list."
          label="Sidebar project list"
          value="Visible"
        />
      </div>
    );
  }

  if (section === "runtime") {
    return (
      <div className="space-y-3">
        <SettingsRow description="Current renderer bridge status." label="Runtime" value={runtimeLabel} />
        <SettingsRow description="Reconnect is enabled when runtime is unavailable." label="Reconnect action" value={runtimeStatus === "not-ready" ? "Enabled" : "Disabled"} />
        <SettingsRow description="Models are loaded from Pi model selection." label="Model catalog" value="Runtime sourced" />
      </div>
    );
  }

  if (section === "diagnostics") {
    return (
      <div className="space-y-3">
        <SettingsRow description="Diagnostic events are mapped into renderer-safe notices." label="Event stream" value="Enabled" />
        <SettingsRow description="Copy session info includes project, session, and status metadata." label="Session info" value="Available" />
        <SettingsRow description="Warnings and errors appear in recovery surfaces." label="Recovery UI" value="Enabled" />
      </div>
    );
  }

  if (section === "about") {
    return (
      <div className="space-y-3">
        <SettingsRow description="Renderer interface foundation." label="UI kit" value="Coss UI" />
        <SettingsRow description="Desktop shell runtime." label="Shell" value="Electron" />
        <SettingsRow description="Milestone owner approval name." label="Approver" value="Jon" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SettingsRow description="Keep the App Frame sidebar visible on launch." label="Sidebar" value="Visible" />
      <SettingsRow description="Open diagnostics from the footer menu." label="Diagnostics shortcut" value="Enabled" />
      <SettingsRow description="Use the selected project in the composer footer." label="Composer project selector" value="Enabled" />
    </div>
  );
}

function SettingsRow({
  description,
  label,
  value
}: {
  description: string;
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/60 p-3">
      <div className="min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="mt-1 text-muted-foreground text-xs leading-5">
          {description}
        </div>
      </div>
      <Badge variant="outline">{value}</Badge>
    </div>
  );
}

function RuntimeStatusBadge({
  runtimeLabel,
  runtimeStatus
}: {
  runtimeLabel: string;
  runtimeStatus: AppFrameProps["runtimeStatus"];
}): ReactElement {
  const variant =
    runtimeStatus === "ready"
      ? "success"
      : runtimeStatus === "running"
        ? "warning"
        : "error";

  return (
    <Badge variant={variant}>
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current"
      />
      {runtimeLabel}
    </Badge>
  );
}
