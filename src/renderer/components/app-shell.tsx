import { useEffect, useMemo, useState } from "react";
import { Bug, Cpu, FolderOpen, MessageSquareText, Play, SendHorizonal, Settings2, Square } from "lucide-react";
import { createAppError } from "@shared/errors";
import {
  Badge,
  Button,
  CopyButton,
  EmptyState,
  ErrorBanner,
  IconButton,
  JsonViewer,
  Panel,
  PanelHeader,
  StatusBadge,
  Tabs,
  Textarea
} from "./primitives";
import { useAppStore } from "../state/app-store";

export function AppShell() {
  const [composerValue, setComposerValue] = useState("");
  const [debugTab, setDebugTab] = useState("raw");
  const { state, actions } = useAppStore();

  useEffect(() => {
    let active = true;

    window.gooeyPi
      ?.ping()
      .then(() => {
        if (active) {
          actions.setBridgeReady(true);
        }
      })
      .catch(() => {
        if (active) {
          actions.setBridgeReady(false);
        }
      });

    if (!window.gooeyPi) {
      actions.setBridgeReady(false);
    }

    return () => {
      active = false;
    };
  }, [actions]);

  useEffect(() => {
    let active = true;

    if (!window.gooeyPi) {
      return () => {
        active = false;
      };
    }

    actions.setProjectLoading(true);
    window.gooeyPi
      .getProjectFolderState()
      .then((snapshot) => {
        if (active) {
          actions.applyProject(snapshot);
        }
      })
      .catch((error) => {
        if (active) {
          actions.setProjectLoading(false);
          actions.addError(
            createAppError({
              code: "IPC_UNAVAILABLE",
              message: "Could not restore project folder state.",
              details: error instanceof Error ? error.message : String(error),
              recoverable: true
            })
          );
        }
      });

    return () => {
      active = false;
    };
  }, [actions]);

  useEffect(() => {
    let active = true;

    if (!window.gooeyPi) {
      return () => {
        active = false;
      };
    }

    window.gooeyPi
      .getPiRuntimeState()
      .then((runtime) => {
        if (active) {
          actions.setPiRuntime(runtime);
        }
      })
      .catch((error) => {
        if (active) {
          actions.addError(
            createAppError({
              code: "PI_RUNTIME_UNAVAILABLE",
              message: "Could not read Pi runtime readiness.",
              details: error instanceof Error ? error.message : String(error),
              recoverable: true
            })
          );
        }
      });

    return () => {
      active = false;
    };
  }, [actions]);

  const bridgeBadge = useMemo(() => {
    if (state.ui.bridgeReady === true) {
      return <Badge className="border-app-success/40 bg-app-success/10 text-app-success">bridge ready</Badge>;
    }

    if (state.ui.bridgeReady === false) {
      return <Badge className="border-app-warning/40 bg-app-warning/10 text-app-warning">storybook mode</Badge>;
    }

    return <Badge>checking bridge</Badge>;
  }, [state.ui.bridgeReady]);

  async function handleSelectFolder() {
    if (!window.gooeyPi) {
      actions.addError(
        createAppError({
          code: "IPC_UNAVAILABLE",
          message: "Project folder selection is unavailable outside Electron.",
          recoverable: true
        })
      );
      return;
    }

    actions.setProjectLoading(true);

    try {
      const result = await window.gooeyPi.selectProjectFolder();

      if (!result.canceled) {
        actions.applyProject(result);
      } else {
        actions.setProjectLoading(false);
      }
    } catch (error) {
      actions.setProjectLoading(false);
      actions.addError(
        createAppError({
          code: "IPC_UNAVAILABLE",
          message: "Project folder selection failed.",
          details: error instanceof Error ? error.message : String(error),
          recoverable: true
        })
      );
    }
  }

  async function handleCreateSession() {
    if (!window.gooeyPi || !state.project.path) {
      actions.addError(
        createAppError({
          code: "SESSION_UNAVAILABLE",
          message: "A valid project folder is required before creating a session.",
          recoverable: true
        })
      );
      return;
    }

    actions.setSessionLoading(true);

    try {
      const result = await window.gooeyPi.createAgentSession(state.project.path);
      actions.applySession(result.session, result.error, result.runtime);
    } catch (error) {
      actions.setSessionLoading(false);
      actions.addError(
        createAppError({
          code: "AGENT_SESSION_CREATE_FAILED",
          message: "Session creation failed.",
          details: error instanceof Error ? error.message : String(error),
          recoverable: true
        })
      );
    }
  }

  const activeProjectError = state.project.errorId
    ? state.errors.find((error) => error.id === state.project.errorId)
    : null;

  const activeSessionError = state.session.errorId
    ? state.errors.find((error) => error.id === state.session.errorId)
    : null;

  const activeRuntimeError = state.piRuntime.errorId
    ? state.errors.find((error) => error.id === state.piRuntime.errorId)
    : null;

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
          <Badge
            className={
              state.piRuntime.status === "ready"
                ? "border-app-success/40 bg-app-success/10 text-app-success"
                : state.piRuntime.status === "errored"
                  ? "border-app-error/40 bg-app-error/10 text-app-error"
                  : undefined
            }
          >
            pi {state.piRuntime.status}
          </Badge>
          {state.project.path ? <Badge className="max-w-80 truncate">{state.project.path}</Badge> : <Badge>No folder</Badge>}
          <StatusBadge status={state.session.status} />
          <IconButton label="Settings">
            <Settings2 className="h-4 w-4" />
          </IconButton>
        </div>
      </header>

      <main className="grid min-h-0 grid-cols-[248px_minmax(420px,1fr)_360px]">
        <Panel className="min-h-0 border-r">
          <PanelHeader title="Project" description="Current working folder" />
          <div className="space-y-3 p-3">
            <Button className="w-full justify-start" type="button" loading={state.ui.projectLoading} onClick={handleSelectFolder}>
              <FolderOpen className="h-4 w-4" />
              Select folder
            </Button>
            <div className="rounded-app-sm border border-app-border bg-app-bg p-3">
              <p className="text-[11px] font-medium uppercase text-app-subtle">Selected path</p>
              <p className="mt-1 break-all font-mono text-[12px] leading-5 text-app-muted">
                {state.project.path ?? "No folder selected"}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge className={state.project.valid ? "border-app-success/40 text-app-success" : undefined}>
                  {state.project.valid ? "valid" : "not ready"}
                </Badge>
                <Badge>{state.project.isGitRepository ? "git repo" : "git unknown"}</Badge>
                <Badge>{state.project.canRead ? "readable" : "read pending"}</Badge>
                <Badge>{state.project.canWrite ? "writable" : "write pending"}</Badge>
              </div>
            </div>
            {activeProjectError ? (
              <ErrorBanner title="Project folder issue" description={activeProjectError.message} />
            ) : null}
            {activeRuntimeError ? <ErrorBanner title="Pi runtime issue" description={activeRuntimeError.message} /> : null}
            {activeSessionError ? <ErrorBanner title="Session issue" description={activeSessionError.message} /> : null}
            <div className="rounded-app-sm border border-app-border bg-app-bg p-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-app-muted" />
                <p className="text-[12px] font-medium text-app-text">Pi SDK</p>
                <Badge>{state.piRuntime.packageVersion}</Badge>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-app-muted">
                {state.session.id
                  ? `Session ${state.session.id.slice(0, 8)} is ${state.session.status}.`
                  : `Runtime is ${state.piRuntime.status}.`}
              </p>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                tone="accent"
                type="button"
                loading={state.ui.sessionLoading}
                disabled={!state.project.valid}
                onClick={handleCreateSession}
              >
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
                <CopyButton value={JSON.stringify(state.rawEvents, null, 2)} />
              </>
            }
          />
          <div className="space-y-3 p-3">
            <Tabs
              value={debugTab}
              onChange={setDebugTab}
              tabs={[
                { value: "raw", label: "Raw", count: state.rawEvents.length },
                { value: "app", label: "App", count: state.normalizedEvents.length },
                { value: "errors", label: "Errors", count: state.errors.length }
              ]}
            />
            {debugTab === "raw" ? (
              <div className="space-y-2">
                {state.rawEvents.map((event) => (
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
            ) : debugTab === "errors" ? (
              <div className="space-y-2">
                {state.errors.length > 0 ? (
                  state.errors.map((error) => (
                    <ErrorBanner key={error.id} title={error.code} description={error.message} />
                  ))
                ) : (
                  <EmptyState title="No errors" description="Recoverable app errors will appear here." />
                )}
              </div>
            ) : (
              <EmptyState title="No app events" description="Normalized app events arrive in the next milestone." />
            )}
          </div>
        </Panel>
      </main>
    </div>
  );
}
