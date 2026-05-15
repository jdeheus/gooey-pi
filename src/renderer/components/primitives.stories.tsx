import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertTriangle, SendHorizonal, Settings2 } from "lucide-react";
import {
  Badge,
  Button,
  CodeBlock,
  EmptyState,
  ErrorBanner,
  IconButton,
  InlineError,
  JsonViewer,
  Panel,
  PanelHeader,
  Spinner,
  StatusBadge,
  Tabs,
  Textarea
} from "./primitives";

const meta = {
  title: "Foundations/Primitives",
  parameters: {
    layout: "padded"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Inventory: Story = {
  render: () => (
    <div className="min-h-screen space-y-4 bg-app-bg p-6 text-app-text">
      <Panel className="rounded-app-md border">
        <PanelHeader title="Controls" description="Default, disabled, loading, icon, and text input states" />
        <div className="grid gap-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Default</Button>
            <Button tone="accent">
              <SendHorizonal className="h-4 w-4" />
              Send
            </Button>
            <Button tone="danger">
              <AlertTriangle className="h-4 w-4" />
              Error
            </Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Settings">
              <Settings2 className="h-4 w-4" />
            </IconButton>
          </div>
          <Textarea placeholder="Textarea primitive" />
          <InlineError>Inline validation error</InlineError>
        </div>
      </Panel>

      <Panel className="rounded-app-md border">
        <PanelHeader title="Status and feedback" />
        <div className="flex flex-wrap items-center gap-2 p-4">
          <Badge>default</Badge>
          <StatusBadge status="idle" />
          <StatusBadge status="ready" />
          <StatusBadge status="running" />
          <StatusBadge status="aborting" />
          <StatusBadge status="errored" />
          <StatusBadge status="disposed" />
          <StatusBadge status="stopped" />
          <Spinner />
        </div>
      </Panel>

      <Panel className="rounded-app-md border">
        <PanelHeader title="State surfaces" />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <EmptyState title="No session" description="Create a session after selecting a valid project folder." />
          <ErrorBanner title="Session failed" description="The SDK wrapper returned a typed app error." />
        </div>
      </Panel>

      <Panel className="rounded-app-md border">
        <PanelHeader title="Debug primitives" />
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <CodeBlock code={"const source = 'renderer-safe';"} />
          <JsonViewer value={{ event: "message.assistant.delta", delta: "hello" }} />
        </div>
      </Panel>

      <Tabs
        value="raw"
        onChange={() => undefined}
        tabs={[
          { value: "raw", label: "Raw", count: 2 },
          { value: "app", label: "App", count: 0 },
          { value: "errors", label: "Errors", count: 1 }
        ]}
      />
    </div>
  )
};
