import type { Meta, StoryObj } from "@storybook/react-vite";
import { FolderOpenIcon, PlusIcon } from "lucide-react";
import { Button } from "@renderer/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle
} from "@renderer/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@renderer/components/ui/empty";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle
} from "@renderer/components/ui/frame";
import { Group, GroupSeparator } from "@renderer/components/ui/group";
import { ScrollArea } from "@renderer/components/ui/scroll-area";

const meta = {
  title: "Foundation/Layout Primitives",
  parameters: {
    layout: "centered"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const eventRows = [
  "Project folder selected",
  "Agent session prepared",
  "Prompt submitted",
  "Streaming response started",
  "Tool request queued",
  "Renderer state updated",
  "Diagnostics snapshot captured",
  "Session returned to idle"
];

export const FrameSurface: Story = {
  render: () => (
    <div className="w-[min(760px,calc(100vw-2rem))]">
      <Frame>
        <FrameHeader className="flex-row items-center justify-between">
          <div>
            <FrameTitle>Renderer foundation</FrameTitle>
            <FrameDescription>
              A normalized frame for future session and diagnostics surfaces.
            </FrameDescription>
          </div>
          <Button size="sm" variant="outline">
            Inspect
          </Button>
        </FrameHeader>
        <FramePanel>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-3">
              <div className="text-muted-foreground text-sm">Status</div>
              <div className="font-medium text-sm">Ready</div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="text-muted-foreground text-sm">Project</div>
              <div className="truncate font-medium text-sm">Gooey-Pi</div>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="text-muted-foreground text-sm">Events</div>
              <div className="font-medium text-sm">{eventRows.length}</div>
            </div>
          </div>
        </FramePanel>
        <FrameFooter>
          <p className="text-muted-foreground text-sm">
            Mocked renderer data only; no runtime session wiring.
          </p>
        </FrameFooter>
      </Frame>
    </div>
  )
};

export const CardsAndGroups: Story = {
  render: () => (
    <div className="grid w-[min(760px,calc(100vw-2rem))] gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Project setup</CardTitle>
          <CardDescription>Fixture content for a future project panel.</CardDescription>
          <CardAction>
            <Button size="sm">Open</Button>
          </CardAction>
        </CardHeader>
        <CardPanel className="flex flex-col gap-3">
          <div className="text-sm">Current folder: `/Users/jdeheus/Documents/Gooey-Pi`</div>
          <div className="text-muted-foreground text-sm">
            This card shows app-like structure without importing preload APIs.
          </div>
        </CardPanel>
        <CardFooter>
          <Group>
            <Button variant="outline">Copy path</Button>
            <GroupSeparator />
            <Button variant="outline">Reveal</Button>
          </Group>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Session controls</CardTitle>
          <CardDescription>Grouped controls preserve a single action silhouette.</CardDescription>
        </CardHeader>
        <CardPanel>
          <Group orientation="vertical">
            <Button variant="outline">Start session</Button>
            <GroupSeparator orientation="horizontal" />
            <Button variant="outline">Pause stream</Button>
            <GroupSeparator orientation="horizontal" />
            <Button variant="destructive-outline">Stop task</Button>
          </Group>
        </CardPanel>
      </Card>
    </div>
  )
};

export const ScrollAreaAndEmpty: Story = {
  render: () => (
    <div className="grid w-[min(760px,calc(100vw-2rem))] gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Event log</CardTitle>
          <CardDescription>Constrained scroll container for renderer events.</CardDescription>
        </CardHeader>
        <CardPanel>
          <ScrollArea className="h-56 rounded-lg border" scrollFade scrollbarGutter>
            <div className="flex flex-col gap-2 p-3">
              {eventRows.map((event, index) => (
                <div className="rounded-md bg-muted px-3 py-2 text-sm" key={event}>
                  {index + 1}. {event}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardPanel>
      </Card>
      <Card>
        <CardPanel>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpenIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No project selected</EmptyTitle>
              <EmptyDescription>
                Choose a folder before starting a Pi session.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button>
                <PlusIcon aria-hidden="true" />
                Select project
              </Button>
            </EmptyContent>
          </Empty>
        </CardPanel>
      </Card>
    </div>
  )
};
