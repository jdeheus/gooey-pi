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
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger
} from "@renderer/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldLabel
} from "@renderer/components/ui/field";
import { Input } from "@renderer/components/ui/input";
import { Switch } from "@renderer/components/ui/switch";

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

export const ProjectComposerModelSelected: Story = {
  render: () => <ProjectComposerStory initialModel="openai-codex/gpt-5.2:high" />
};

export const ProjectComposerReadyToSubmit: Story = {
  render: () => <ProjectComposerStory focused initialModel="openai-codex/gpt-5.5:xhigh" />
};

function SettingsDialogPreview({
  defaultOpen = false
}: {
  defaultOpen?: boolean;
}): React.ReactElement {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <SettingsIcon aria-hidden="true" />
        Renderer settings
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Renderer settings</DialogTitle>
          <DialogDescription>
            Mocked settings content for the renderer interaction pattern.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="space-y-5">
          <Field>
            <FieldLabel>Default project path</FieldLabel>
            <Input defaultValue="/Users/jdeheus/Documents/Gooey-Pi" />
            <FieldDescription>
              Stored path preview only. This story does not persist settings.
            </FieldDescription>
          </Field>
          <Field className="flex-row items-center justify-between rounded-lg border bg-muted p-3">
            <div>
              <FieldLabel>Show diagnostics</FieldLabel>
              <FieldDescription>
                Keep renderer diagnostics visible during review.
              </FieldDescription>
            </div>
            <Switch defaultChecked />
          </Field>
          <Field className="flex-row items-center justify-between rounded-lg border bg-muted p-3">
            <div>
              <FieldLabel>Auto-restore project</FieldLabel>
              <FieldDescription>
                Restore the last selected project on launch.
              </FieldDescription>
            </div>
            <Switch />
          </Field>
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
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
                        <span>{item.label}</span>
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
  initialModel = "openai-codex/gpt-5.5:medium"
}: {
  focused?: boolean;
  initialModel?: string;
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
        selectedModel={selectedModel}
      />
    </div>
  );
}
