import {
  FolderOpenIcon,
  SettingsIcon,
  TerminalIcon,
  WrenchIcon
} from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import {
  ModelMenu,
  ProjectComposer,
  ProjectSelectMenu,
  RendererSettingsDialog,
  StatusCards
} from "@renderer/surfaces/app-frame";
import type { PiModelCatalog } from "@shared/pi";
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
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandShortcut
} from "@renderer/components/ui/command";

const meta = {
  title: "Surfaces/App Frame Interactions",
  parameters: {
    layout: "centered"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const modelCatalog: PiModelCatalog = {
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
          id: "gpt-5.5",
          label: "GPT-5.5",
          thinkingLevels: ["off", "minimal", "low", "medium", "high", "xhigh"]
        }
      ]
    }
  ]
};

const commands = [
  {
    group: "Project",
    items: [
      { icon: <FolderOpenIcon aria-hidden="true" />, label: "Open project", shortcut: "O" },
      { icon: <WrenchIcon aria-hidden="true" />, label: "Validate project", shortcut: "V" }
    ]
  },
  {
    group: "Session",
    items: [
      { icon: <TerminalIcon aria-hidden="true" />, label: "Start session", shortcut: "S" },
      { icon: <SettingsIcon aria-hidden="true" />, label: "Open settings", shortcut: "," }
    ]
  }
];

const projects = [
  {
    chats: [
      { name: "Project setup", unread: true, updatedSecondsAgo: 28 },
      { name: "Renderer shell", updatedSecondsAgo: 7 * 60 },
      { name: "Diagnostics", updatedSecondsAgo: 2 * 60 * 60 }
    ],
    name: "Gooey Pi"
  },
  {
    chats: [
      { name: "Long filename review", updatedSecondsAgo: 11 * 60 },
      { name: "Compaction states", unread: true, updatedSecondsAgo: 44 * 60 }
    ],
    name: "renderer-session-state-export-with-diagnostics-and-event-stream-notes"
  }
];

export const ProjectPickerOpenProjectCard: Story = {
  render: () => (
    <div className="w-[min(680px,calc(100vw-2rem))]">
      <StatusCards />
    </div>
  )
};

export const ProjectPickerSelectedProject: Story = {
  render: () => (
    <Card className="w-[min(420px,calc(100vw-2rem))]">
      <CardHeader>
        <CardTitle>Selected project</CardTitle>
        <CardDescription>Mocked project picker selected state.</CardDescription>
      </CardHeader>
      <CardPanel>
        <button
          className="w-full cursor-pointer rounded-lg border bg-muted p-3 text-left outline-none transition-[background-color,border-color,box-shadow] hover:border-ring/50 hover:bg-accent hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          type="button"
        >
          <div className="text-muted-foreground text-xs">Project</div>
          <div className="font-medium text-sm">Gooey Pi</div>
          <div className="mt-1 truncate text-muted-foreground text-xs">
            /Users/jdeheus/Documents/Gooey-Pi
          </div>
        </button>
      </CardPanel>
    </Card>
  )
};

export const ProjectPickerEmpty: Story = {
  render: () => (
    <Card className="w-[min(420px,calc(100vw-2rem))]">
      <CardHeader>
        <CardTitle>No project selected</CardTitle>
        <CardDescription>
          Mocked empty project picker state before a folder is selected.
        </CardDescription>
      </CardHeader>
      <CardPanel className="flex justify-center">
        <Button variant="outline">
          <FolderOpenIcon aria-hidden="true" />
          Open project
        </Button>
      </CardPanel>
    </Card>
  )
};

export const SettingsDialogClosed: Story = {
  render: () => <SettingsDialogPreview />
};

export const SettingsDialogOpen: Story = {
  render: () => <SettingsDialogPreview defaultOpen />
};

export const SettingsDialogGeneralSection: Story = {
  render: () => <SettingsDialogPreview defaultOpen defaultSection="general" />
};

export const SettingsDialogModelsSection: Story = {
  render: () => <SettingsDialogPreview defaultOpen defaultSection="models" />
};

export const SettingsDialogAgentsSection: Story = {
  render: () => <SettingsDialogPreview defaultOpen defaultSection="agents" />
};

export const SettingsDialogApprovalsSection: Story = {
  render: () => <SettingsDialogPreview defaultOpen defaultSection="approvals" />
};

export const SettingsDialogProjectsSection: Story = {
  render: () => <SettingsDialogPreview defaultOpen defaultSection="projects" />
};

export const SettingsDialogRuntimeSection: Story = {
  render: () => <SettingsDialogPreview defaultOpen defaultSection="runtime" />
};

export const SettingsDialogDiagnosticsSection: Story = {
  render: () => <SettingsDialogPreview defaultOpen defaultSection="diagnostics" />
};

export const SettingsDialogAboutSection: Story = {
  render: () => <SettingsDialogPreview defaultOpen defaultSection="about" />
};

export const ProjectSelectorOpen: Story = {
  render: () => (
    <div className="flex w-[min(680px,calc(100vw-2rem))] justify-end rounded-lg border bg-muted p-3">
      <ProjectSelectMenu
        initialOpen
        projects={projects}
        selectedProjectName="Gooey Pi"
      />
    </div>
  )
};

export const ProjectSelectorNoResults: Story = {
  render: () => (
    <div className="flex w-[min(680px,calc(100vw-2rem))] justify-end rounded-lg border bg-muted p-3">
      <ProjectSelectMenu
        initialOpen
        initialQuery="missing project"
        projects={projects}
        selectedProjectName="Gooey Pi"
      />
    </div>
  )
};

export const CommandSearchEmptyQuery: Story = {
  render: () => <CommandSearchPreview />
};

export const CommandSearchPopulatedResults: Story = {
  render: () => <CommandSearchPreview initialQuery="project" />
};

export const CommandSearchNoResults: Story = {
  render: () => <CommandSearchPreview initialQuery="diagnostics" />
};

export const ModelPickerNestedSearch: Story = {
  render: () => {
    const [selectedModel, setSelectedModel] = useState(
      "openai-codex/gpt-5.5:medium"
    );

    return (
      <div className="flex w-[min(420px,calc(100vw-2rem))] justify-end rounded-lg border bg-muted p-3">
        <ModelMenu
          initialOpen
          modelCatalog={modelCatalog}
          onSelectModel={setSelectedModel}
          selectedModel={selectedModel}
        />
      </div>
    );
  }
};

export const ProjectComposerEmpty: Story = {
  render: () => <ProjectComposerStory />
};

export const ProjectComposerFocused: Story = {
  render: () => <ProjectComposerStory focused />
};

export const ProjectComposerPlanMode: Story = {
  render: () => <ProjectComposerStory focused planMode />
};

export const ProjectComposerModelSelected: Story = {
  render: () => <ProjectComposerStory initialModel="openai-codex/gpt-5.2:high" />
};

export const ProjectComposerReadyToSubmit: Story = {
  render: () => <ProjectComposerStory focused initialModel="openai-codex/gpt-5.5:xhigh" />
};

function SettingsDialogPreview({
  defaultOpen = false,
  defaultSection = "general"
}: {
  defaultOpen?: boolean;
  defaultSection?:
    | "general"
    | "models"
    | "agents"
    | "approvals"
    | "projects"
    | "runtime"
    | "diagnostics"
    | "about";
}): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <SettingsIcon aria-hidden="true" />
        Renderer settings
      </Button>
      <RendererSettingsDialog
        defaultSection={defaultSection}
        onOpenChange={setOpen}
        open={open}
        runtimeLabel="Renderer ready"
        runtimeStatus="ready"
      />
    </>
  );
}

function CommandSearchPreview({
  initialQuery = ""
}: {
  initialQuery?: string;
}): React.ReactElement {
  const [query, setQuery] = useState(initialQuery);
  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return commands;
    }

    return commands
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(normalizedQuery)
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <CommandDialog defaultOpen>
      <CommandDialogPopup>
        <Command value={query}>
          <CommandPanel>
            <CommandInput
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search commands"
              value={query}
            />
            <CommandList>
              {filteredCommands.length > 0 ? (
                filteredCommands.map((group) => (
                  <CommandGroup key={group.group}>
                    <CommandGroupLabel>{group.group}</CommandGroupLabel>
                    {group.items.map((item) => (
                      <CommandItem key={item.label} value={item.label}>
                        {item.icon}
                        <span className="ml-4">{item.label}</span>
                        <CommandShortcut>{item.shortcut}</CommandShortcut>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))
              ) : (
                <CommandEmpty>No commands found.</CommandEmpty>
              )}
            </CommandList>
          </CommandPanel>
          <CommandFooter>
            <span>Mocked command palette</span>
            <Badge variant="info">Preview</Badge>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}

function ProjectComposerStory({
  focused = false,
  initialModel = "openai-codex/gpt-5.5:medium",
  planMode = false
}: {
  focused?: boolean;
  initialModel?: string;
  planMode?: boolean;
}): React.ReactElement {
  const [selectedModel, setSelectedModel] = useState(initialModel);

  return (
    <div className="w-[min(680px,calc(100vw-2rem))]">
      <ProjectComposer
        className={
          focused ? "border-ring shadow-none ring-[3px] ring-ring/24" : undefined
        }
        modelCatalog={modelCatalog}
        onSelectModel={setSelectedModel}
        planMode={planMode}
        selectedModel={selectedModel}
      />
    </div>
  );
}
