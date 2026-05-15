import { useEffect, useMemo, useState } from "react";
import { Bug, FolderOpen, MessageSquareText, Play, SendHorizonal, Settings2, Square } from "lucide-react";
import type { RawPiEvent } from "@shared/events";
import type { SessionStatus } from "@shared/session";
import {
  Badge,
  Button,
  CopyButton,
  EmptyState,
  IconButton,
  JsonViewer,
  Panel,
  PanelHeader,
  StatusBadge,
  Tabs,
  Textarea
} from "./primitives";

const placeholderEvents: RawPiEvent[] = [
  {
    id: "raw-0001",
    sessionId: "session-preview",
    timestamp: "2026-05-15T17:00:00.000Z",
    type: "session.created",
    payload: { projectPath: "/Users/jdeheus/Documents/Gooey-Pi" }
  },
  {
    id: "raw-0002",
    sessionId: "session-preview",
    timestamp: "2026-05-15T17:01:04.000Z",
    type: "assistant.delta",
    payload: { delta: "Renderer-safe event placeholder" }
  }
];

export function AppShell() {
  const [composerValue, setComposerValue] = useState("");
  const [debugTab, setDebugTab] = useState("raw");
  const [bridgeStatus, setBridgeStatus] = useState<"unchecked" | "ready" | "unavailable">("unchecked");
  const sessionStatus: SessionStatus = "idle";

  useEffect(() => {
    let active = true;

    window.gooeyPi
      ?.ping()
      .then(() => {
        if (active) {
          setBridgeStatus("ready");
        }
      })
      .catch(() => {
        if (active) {
          setBridgeStatus("unavailable");
        }
      });

    if (!window.gooeyPi) {
      setBridgeStatus("unavailable");
    }

    return () => {
      active = false;
    };
  }, []);

  const bridgeBadge = useMemo(() => {
    if (bridgeStatus === "ready") {
      return <Badge className="border-app-success/40 bg-app-success/10 text-app-success">bridge ready</Badge>;
    }

    if (bridgeStatus === "unavailable") {
      return <Badge className="border-app-warning/40 bg-app-warning/10 text-app-warning">storybook mode</Badge>;
    }

    return <Badge>checking bridge</Badge>;
  }, [bridgeStatus]);

  return (
    <div className="grid h-screen min-h-[680px] grid-rows-[48px_1fr] bg-app-bg text-app-text">
      <header className="flex items-center justify-between border-b border-app-border bg-app-panel px-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-app-sm border border-app-border bg-app-panel-elevated">
            <MessageSquareText className="h-4 w-4 text-app-accent" />
          </div>
          <div>
            <h1 className="text-[14px] font-semibold leading-4">Gooey Pi</h1>
            <p className="text-[11px] text-app-muted">Electron renderer foundation</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {bridgeBadge}
          <StatusBadge status={sessionStatus} />
          <IconButton label="Settings">
            <Settings2 className="h-4 w-4" />
          </IconButton>
        </div>
      </header>

      <main className="grid min-h-0 grid-cols-[248px_minmax(420px,1fr)_360px]">
        <Panel className="min-h-0 border-r">
          <PanelHeader title="Project" description="Current working folder" />
          <div className="space-y-3 p-3">
            <Button className="w-full justify-start" type="button">
              <FolderOpen className="h-4 w-4" />
              Select folder
            </Button>
            <div className="rounded-app-sm border border-app-border bg-app-bg p-3">
              <p className="text-[11px] font-medium uppercase text-app-subtle">Selected path</p>
              <p className="mt-1 break-all font-mono text-[12px] leading-5 text-app-muted">No folder selected</p>
            </div>
            <div className="space-y-2">
              <Button className="w-full justify-start" tone="accent" type="button">
                <Play className="h-4 w-4" />
                Create session
              </Button>
              <Button className="w-full justify-start" type="button" disabled>
                <Square className="h-4 w-4" />
                Stop run
              </Button>
            </div>
          </div>
        </Panel>

        <section className="grid min-h-0 grid-rows-[1fr_auto] border-r border-app-border">
          <div className="min-h-0 overflow-auto p-4">
            <EmptyState
              title="No messages yet"
              description="The foundation shell is ready for folder selection, session creation, and streaming messages."
            />
          </div>
          <form className="border-t border-app-border bg-app-panel p-3">
            <div className="flex items-end gap-2">
              <Textarea
                aria-label="Prompt"
                placeholder="Send a prompt to the active Pi session"
                value={composerValue}
                onChange={(event) => setComposerValue(event.target.value)}
              />
              <Button type="submit" tone="accent" disabled={composerValue.trim().length === 0}>
                <SendHorizonal className="h-4 w-4" />
                Send
              </Button>
            </div>
          </form>
        </section>

        <Panel className="min-h-0">
          <PanelHeader
            title="Debug"
            description="Renderer-safe mock events"
            actions={
              <>
                <Bug className="h-4 w-4 text-app-muted" />
                <CopyButton value={JSON.stringify(placeholderEvents, null, 2)} />
              </>
            }
          />
          <div className="space-y-3 p-3">
            <Tabs
              value={debugTab}
              onChange={setDebugTab}
              tabs={[
                { value: "raw", label: "Raw", count: placeholderEvents.length },
                { value: "app", label: "App", count: 0 },
                { value: "errors", label: "Errors", count: 0 }
              ]}
            />
            {debugTab === "raw" ? (
              <div className="space-y-2">
                {placeholderEvents.map((event) => (
                  <div key={event.id} className="rounded-app-sm border border-app-border bg-app-bg p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[12px] text-app-text">{event.type}</p>
                      <Badge>{event.id}</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-app-subtle">{event.timestamp}</p>
                    <div className="mt-2">
                      <JsonViewer value={event.payload} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No entries" description="This tab is wired for the next implementation milestones." />
            )}
          </div>
        </Panel>
      </main>
    </div>
  );
}
