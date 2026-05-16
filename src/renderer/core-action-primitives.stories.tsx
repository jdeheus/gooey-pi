import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  InfoIcon,
  SettingsIcon,
  TriangleAlertIcon
} from "lucide-react";
import { Badge } from "@renderer/components/ui/badge";
import { Button } from "@renderer/components/ui/button";
import { Separator } from "@renderer/components/ui/separator";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger
} from "@renderer/components/ui/tooltip";

const meta = {
  title: "Foundation/Core Action Primitives",
  parameters: {
    layout: "centered"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const ButtonVariants: Story = {
  render: () => (
    <div className="flex w-[min(720px,calc(100vw-2rem))] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="destructive">Destructive</Button>
        <Button variant="destructive-outline">Destructive outline</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button aria-label="Settings" size="icon" variant="outline">
          <SettingsIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex w-[min(720px,calc(100vw-2rem))] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info">
          <InfoIcon aria-hidden="true" />
          Info
        </Badge>
        <Badge variant="success">
          <CheckCircle2Icon aria-hidden="true" />
          Success
        </Badge>
        <Badge variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          Warning
        </Badge>
        <Badge variant="error">
          <CircleAlertIcon aria-hidden="true" />
          Error
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm">Small</Badge>
        <Badge size="lg">Large</Badge>
        <Button variant="outline">
          Queue
          <Badge className="-me-1" variant="outline">
            4
          </Badge>
        </Button>
      </div>
    </div>
  )
};

export const SeparatorsAndTooltips: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex w-[min(720px,calc(100vw-2rem))] flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Session actions</span>
          <Separator />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline">Open project</Button>
            <Separator className="h-5" orientation="vertical" />
            <Button variant="ghost">Clear output</Button>
            <Separator className="h-5" orientation="vertical" />
            <Button variant="destructive-outline">Stop task</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button aria-label="Open settings" size="icon" variant="outline" />
              }
            >
              <SettingsIcon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipPopup>Open settings</TooltipPopup>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>
              Explain status
            </TooltipTrigger>
            <TooltipPopup side="bottom">
              Shows a short non-interactive hint on hover or focus.
            </TooltipPopup>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
};
