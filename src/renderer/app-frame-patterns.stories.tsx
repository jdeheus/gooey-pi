import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  DiagnosticsEventSurface,
  ModelMenu,
  ProjectComposer,
  RendererDiagnosticsDialog,
  SessionPanel,
  SidebarFooter,
  SidebarProjectGroup,
  StatusCards
} from "@renderer/surfaces/app-frame";
import type { PiModelCatalog } from "@shared/pi";
import type {
  DiagnosticsEvent,
  SessionPanelStep,
  SidebarProject
} from "@renderer/surfaces/app-frame";

const meta = {
  title: "Foundation/App Frame Patterns",
  parameters: {
    layout: "centered"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const multiProviderModelCatalog: PiModelCatalog = {
  defaultModelValue: "openai-codex/gpt-5.5:medium",
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
    },
    {
      id: "local",
      label: "Local",
      models: [
        {
          id: "faux-1",
          label: "Faux Model",
          thinkingLevels: ["off"]
        }
      ]
    }
  ]
};

const sidebarProject: SidebarProject = {
  chats: [
    { name: "Project setup", unread: true, updatedSecondsAgo: 28 },
    { name: "Renderer shell", updatedSecondsAgo: 7 * 60 },
    { name: "Coss primitives", unread: true, updatedSecondsAgo: 42 * 60 },
    { name: "Storybook coverage", updatedSecondsAgo: 2 * 60 * 60 },
    { name: "Electron startup", updatedSecondsAgo: 9 * 60 * 60 }
  ],
  name: "UI"
};

const longNameSidebarProject: SidebarProject = {
  chats: [
    {
      name: "Review extremely long renderer navigation label that should truncate",
      unread: true,
      updatedSecondsAgo: 55
    },
    {
      name: "Coordinate model picker no-results state with Storybook fixtures",
      updatedSecondsAgo: 18 * 60
    },
    {
      name: "Document project creation empty surface acceptance criteria",
      updatedSecondsAgo: 2 * 24 * 60 * 60
    }
  ],
  name: "Interface implementation review"
};

const sessionSteps: SessionPanelStep[] = [
  { label: "Project context loaded", status: "complete" },
  { label: "Renderer shell review", status: "current" },
  { label: "Diagnostics handoff", status: "pending" }
];

const diagnosticEvents: DiagnosticsEvent[] = [
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

export const ProjectComposerParticle: Story = {
  render: () => {
    const [selectedModel, setSelectedModel] = useState(
      "openai-codex/gpt-5.5:medium"
    );

    return (
      <div className="w-[min(680px,calc(100vw-2rem))]">
        <ProjectComposer
          onSelectModel={setSelectedModel}
          selectedModel={selectedModel}
        />
      </div>
    );
  }
};

export const NestedModelPicker: Story = {
  render: () => {
    const [selectedModel, setSelectedModel] = useState(
      "openai-codex/gpt-5.4-mini:high"
    );

    return (
      <div className="flex w-[min(420px,calc(100vw-2rem))] justify-end rounded-lg border bg-muted p-3">
        <ModelMenu
          modelCatalog={multiProviderModelCatalog}
          onSelectModel={setSelectedModel}
          selectedModel={selectedModel}
        />
      </div>
    );
  }
};

export const ModelMenuSearch: Story = {
  render: () => {
    const [selectedModel, setSelectedModel] = useState(
      "openai-codex/gpt-5.5:medium"
    );

    return (
      <div className="flex w-[min(420px,calc(100vw-2rem))] justify-end rounded-lg border bg-muted p-3">
        <ModelMenu
          modelCatalog={multiProviderModelCatalog}
          onSelectModel={setSelectedModel}
          selectedModel={selectedModel}
        />
      </div>
    );
  }
};

export const ModelMenuNoResults: Story = {
  render: () => {
    const [selectedModel, setSelectedModel] = useState(
      "openai-codex/gpt-5.5:medium"
    );

    return (
      <div className="flex w-[min(420px,calc(100vw-2rem))] justify-end rounded-lg border bg-muted p-3">
        <ModelMenu
          initialModelQuery="no matching model"
          initialOpen
          modelCatalog={multiProviderModelCatalog}
          onSelectModel={setSelectedModel}
          selectedModel={selectedModel}
        />
      </div>
    );
  }
};

export const ProjectOpenCard: Story = {
  render: () => (
    <div className="w-[min(680px,calc(100vw-2rem))]">
      <StatusCards />
    </div>
  )
};

export const SessionPanelSurface: Story = {
  render: () => (
    <div className="w-[min(680px,calc(100vw-2rem))]">
      <SessionPanel
        projectName="Gooey Pi"
        sessionStatus="Session active"
        steps={sessionSteps}
      />
    </div>
  )
};

export const DiagnosticsEventSurfaceStates: Story = {
  render: () => (
    <div className="w-[min(440px,calc(100vw-2rem))]">
      <DiagnosticsEventSurface events={diagnosticEvents} />
    </div>
  )
};

export const DiagnosticsEventFilteredErrors: Story = {
  render: () => (
    <div className="w-[min(560px,calc(100vw-2rem))]">
      <DiagnosticsEventSurface
        events={diagnosticEvents}
        initialFilter="error"
      />
    </div>
  )
};

export const DiagnosticsEventEmptyState: Story = {
  render: () => (
    <div className="w-[min(560px,calc(100vw-2rem))]">
      <DiagnosticsEventSurface events={[]} />
    </div>
  )
};

export const DiagnosticsDialogOpen: Story = {
  render: () => (
    <RendererDiagnosticsDialog
      events={diagnosticEvents}
      onOpenChange={() => undefined}
      open
    />
  )
};

export const SidebarProjectGroupDefault: Story = {
  render: () => (
    <div className="w-60 rounded-lg border bg-sidebar p-3 text-sidebar-foreground">
      <SidebarProjectGroup project={sidebarProject} />
    </div>
  )
};

export const SidebarProjectGroupCollapsed: Story = {
  render: () => (
    <div className="w-60 rounded-lg border bg-sidebar p-3 text-sidebar-foreground">
      <SidebarProjectGroup defaultOpen={false} project={sidebarProject} />
    </div>
  )
};

export const SidebarProjectGroupLongNames: Story = {
  render: () => (
    <div className="w-60 rounded-lg border bg-sidebar p-3 text-sidebar-foreground">
      <SidebarProjectGroup project={longNameSidebarProject} />
    </div>
  )
};

export const SidebarFooterStatus: Story = {
  render: () => (
    <div className="w-60 rounded-lg border bg-sidebar p-3 text-sidebar-foreground">
      <SidebarFooter runtimeLabel="Renderer ready" runtimeStatus="ready" />
    </div>
  )
};

export const SidebarFooterRunning: Story = {
  render: () => (
    <div className="w-60 rounded-lg border bg-sidebar p-3 text-sidebar-foreground">
      <SidebarFooter runtimeLabel="Session running" runtimeStatus="running" />
    </div>
  )
};

export const SidebarFooterMenuOpen: Story = {
  render: () => (
    <div className="w-60 rounded-lg border bg-sidebar p-3 text-sidebar-foreground">
      <SidebarFooter
        diagnosticsEvents={diagnosticEvents}
        initialMenuOpen
        runtimeLabel="Session running"
        runtimeStatus="running"
      />
    </div>
  )
};

export const SidebarFooterSetupNeeded: Story = {
  render: () => (
    <div className="w-60 rounded-lg border bg-sidebar p-3 text-sidebar-foreground">
      <SidebarFooter
        diagnosticsEvents={diagnosticEvents}
        runtimeLabel="Setup needed"
        runtimeStatus="not-ready"
      />
    </div>
  )
};
