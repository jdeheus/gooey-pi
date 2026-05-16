import {
  ArrowUpIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  InfoIcon,
  LoaderCircleIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  TriangleAlertIcon
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

export interface SidebarChat {
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
  chatItems?: ChatItem[];
  diagnosticsEvents?: DiagnosticsEvent[];
  hasProjects?: boolean;
  initialNavQuery?: string;
  isRefreshing?: boolean;
  onClearDiagnostics?: () => void;
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
  chatItems,
  diagnosticsEvents = DIAGNOSTIC_EVENTS,
  hasProjects = false,
  initialNavQuery = "",
  isRefreshing = false,
  modelCatalog,
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
  const [navQuery, setNavQuery] = useState(initialNavQuery);
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
                      <SidebarProjectGroup key={project.name} project={project} />
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
          {hasProjectSelected && surfaceKind !== "active" && (
            <header className="flex h-14 shrink-0 items-center border-b px-5">
              <div>
                <div className="font-medium text-sm">{projectName}</div>
                <div className="text-muted-foreground text-xs">{sessionStatus}</div>
              </div>
            </header>
          )}

          <AppFrameMainSurface
            chatItems={chatItems}
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
            steps={sessionSteps}
            surface={surfaceKind}
          />
        </section>
      </div>
    </main>
  );
}

function AppFrameMainSurface({
  chatItems,
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
  steps,
  surface
}: {
  chatItems?: ChatItem[];
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
        metrics={runtimeStatus === "running" ? CHAT_BODY_DEFAULT_METRICS : {
          ...CHAT_BODY_DEFAULT_METRICS,
          isUnavailable: true
        }}
      />
    );
  }

  if (surface === "empty" || surface === "runtime-ready-no-project") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyProjectSurface
          modelCatalog={modelCatalog}
          onOpenProject={onOpenProject}
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
  onOpenProject
}: {
  modelCatalog?: PiModelCatalog | null;
  onOpenProject?: () => void;
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

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="text-center">
        <h1 className="font-heading font-semibold text-3xl">Create a project</h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm leading-6">
          What do you want to work on today?
        </p>
      </div>
      <ProjectComposer
        modelCatalog={resolvedModelCatalog}
        onSelectModel={setSelectedModel}
        selectedModel={selectedModel}
      />
      <StatusCards onOpenProject={onOpenProject} />
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
  return (
    <InputGroup className={className}>
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

export function SidebarProjectGroup({
  defaultOpen = true,
  project
}: {
  defaultOpen?: boolean;
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
          {project.chats.map((chat) => (
            <Button
              className="h-auto justify-start px-2 py-6 text-muted-foreground"
              key={chat.name}
              variant="ghost"
            >
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate">{chat.name}</span>
                <span className="block truncate text-muted-foreground/70 text-xs">
                  {formatRelativeTimestamp(chat.updatedSecondsAgo)}
                </span>
              </span>
              {chat.unread && (
                <span
                  aria-label="Unread activity"
                  className="ml-auto size-2 shrink-0 rounded-full bg-info"
                />
              )}
            </Button>
          ))}
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
            <MenuItem closeOnClick onClick={onOpenSettings}>
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
    </footer>
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
