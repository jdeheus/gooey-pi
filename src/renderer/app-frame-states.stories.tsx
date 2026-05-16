import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppFrame, SidebarFooter } from "@renderer/surfaces/app-frame";
import type {
  DiagnosticsEvent,
  SessionPanelStep,
  SidebarProject
} from "@renderer/surfaces/app-frame";
import type { ChatItem } from "@shared/chat";

const meta = {
  title: "Surfaces/App Frame States",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const runtimeSidebarProjects: SidebarProject[] = [
  {
    chats: [
      { name: "Project setup", unread: true, updatedSecondsAgo: 28 },
      { name: "Renderer shell", updatedSecondsAgo: 7 * 60 },
      { name: "Runtime wiring", unread: true, updatedSecondsAgo: 18 * 60 },
      { name: "Diagnostics", updatedSecondsAgo: 2 * 60 * 60 }
    ],
    name: "Gooey Pi"
  }
];

const runtimeSteps: SessionPanelStep[] = [
  { label: "Project context loaded", status: "complete" },
  { label: "Pi runtime ready", status: "complete" },
  { label: "Session running", status: "current" }
];

const runtimeDiagnostics: DiagnosticsEvent[] = [
  {
    description: "Project folder state was restored through the preload API.",
    severity: "normal",
    timeLabel: "now",
    title: "Project restored"
  },
  {
    description: "Event stream snapshot is available to the renderer adapter.",
    severity: "normal",
    timeLabel: "1m ago",
    title: "Event stream connected"
  }
];

const runtimeErrorDiagnostics: DiagnosticsEvent[] = [
  {
    description: "Pi runtime package could not be started.",
    severity: "error",
    timeLabel: "now",
    title: "Runtime start failed"
  },
  {
    description: "Reconnect is available from the footer settings menu.",
    severity: "warning",
    timeLabel: "1m ago",
    title: "Recovery available"
  }
];

const activeChatItems: ChatItem[] = [
  {
    content: "Please identify the active app frame state and use the real runtime wiring.",
    id: "runtime-user-message",
    kind: "user-message",
    timestampLabel: "10:34 AM"
  },
  {
    content:
      "The app frame is now driven by normalized project, runtime, session, and event stream state.",
    costLabel: "$0.02",
    id: "runtime-assistant-message",
    kind: "assistant-message",
    modelLabel: "GPT-5.5",
    thinkingLevelLabel: "medium"
  }
];

const baseArgs = {
  diagnosticsEvents: runtimeDiagnostics,
  hasProjects: true,
  projectName: "Gooey Pi",
  runtimeLabel: "Renderer ready",
  runtimeStatus: "ready" as const,
  sessionStatus: "Session ready",
  sessionSteps: runtimeSteps,
  sidebarProjects: runtimeSidebarProjects
};

export const EmptyFirstLoad: Story = {
  render: () => (
    <AppFrame
      hasProjects={false}
      projectName="No project selected"
      runtimeLabel="Renderer ready"
      runtimeStatus="ready"
      sessionStatus="Idle"
      surface="empty"
    />
  )
};

export const LoadingRendererState: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      isRefreshing
      runtimeLabel="Loading renderer"
      runtimeStatus="not-ready"
      sessionStatus="Loading"
      surface="loading"
    />
  )
};

export const ActiveSession: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      chatItems={activeChatItems}
      runtimeLabel="Session running"
      runtimeStatus="running"
      sessionStatus="Session active"
      surface="active"
    />
  )
};

export const ErrorState: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      diagnosticsEvents={runtimeErrorDiagnostics}
      runtimeLabel="Runtime error"
      runtimeStatus="not-ready"
      sessionStatus="Session error"
      surface="error"
    />
  )
};

export const UnavailableState: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      diagnosticsEvents={runtimeErrorDiagnostics}
      runtimeLabel="Setup needed"
      runtimeStatus="not-ready"
      sessionStatus="Unavailable"
      surface="unavailable"
    />
  )
};

export const DisconnectedState: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      diagnosticsEvents={runtimeErrorDiagnostics}
      runtimeLabel="Disconnected"
      runtimeStatus="not-ready"
      sessionStatus="Event stream disconnected"
      surface="disconnected"
    />
  )
};

export const RuntimeStarting: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      runtimeLabel="Runtime starting"
      runtimeStatus="not-ready"
      sessionStatus="Starting runtime"
      surface="runtime-starting"
    />
  )
};

export const RuntimeReadyNoProject: Story = {
  render: () => (
    <AppFrame
      hasProjects={false}
      projectName="No project selected"
      runtimeLabel="Renderer ready"
      runtimeStatus="ready"
      sessionStatus="Idle"
      surface="runtime-ready-no-project"
    />
  )
};

export const ProjectRestored: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      sessionStatus="Restored project"
      surface="project-restored"
    />
  )
};

export const ProjectInvalid: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      diagnosticsEvents={runtimeErrorDiagnostics}
      runtimeLabel="Project invalid"
      runtimeStatus="not-ready"
      sessionStatus="Project unavailable"
      surface="project-invalid"
    />
  )
};

export const SessionCreating: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      runtimeLabel="Renderer ready"
      runtimeStatus="ready"
      sessionStatus="Creating session"
      surface="session-creating"
    />
  )
};

export const SessionRunningWithChatBody: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      chatItems={activeChatItems}
      runtimeLabel="Session running"
      runtimeStatus="running"
      sessionStatus="Session active"
      surface="active"
    />
  )
};

export const ReconnectInProgress: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      diagnosticsEvents={runtimeErrorDiagnostics}
      runtimeLabel="Reconnecting"
      runtimeStatus="not-ready"
      sessionStatus="Reconnect in progress"
      surface="reconnecting"
    />
  )
};

export const FooterMenuDisabledActions: Story = {
  render: () => (
    <div className="flex min-h-screen items-end bg-sidebar text-sidebar-foreground">
      <aside className="w-60 border-r">
        <SidebarFooter
          initialMenuOpen
          runtimeLabel="Renderer ready"
          runtimeStatus="ready"
        />
      </aside>
    </div>
  )
};

export const FooterMenuRuntimeError: Story = {
  render: () => (
    <div className="flex min-h-screen items-end bg-sidebar text-sidebar-foreground">
      <aside className="w-60 border-r">
        <SidebarFooter
          initialMenuOpen
          runtimeLabel="Runtime error"
          runtimeStatus="not-ready"
        />
      </aside>
    </div>
  )
};

export const EventStreamDisconnectedRecovery: Story = {
  render: () => (
    <AppFrame
      {...baseArgs}
      diagnosticsEvents={runtimeErrorDiagnostics}
      runtimeLabel="Disconnected"
      runtimeStatus="not-ready"
      sessionStatus="Event stream disconnected"
      surface="disconnected"
    />
  )
};
