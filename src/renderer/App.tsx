import { AppFrame } from "@renderer/surfaces/app-frame";
import { useRendererAppFrameState } from "@renderer/app-state";

export function App() {
  const appFrameState = useRendererAppFrameState();

  return (
    <AppFrame
      chatItems={appFrameState.chatItems}
      chatRunStatus={appFrameState.chatRunStatus}
      diagnosticsEvents={appFrameState.diagnosticsEvents}
      hasProjects={appFrameState.hasProjects}
      isRefreshing={appFrameState.isRefreshing}
      modelCatalog={appFrameState.modelCatalog}
      onClearDiagnostics={appFrameState.onClearDiagnostics}
      onCopySessionInfo={appFrameState.onCopySessionInfo}
      onComposerSubmit={appFrameState.onComposerSubmit}
      onOpenDiagnostics={appFrameState.onOpenDiagnostics}
      onOpenProject={appFrameState.onOpenProject}
      onOpenSettings={appFrameState.onOpenSettings}
      onReconnect={appFrameState.onReconnect}
      onRetryRuntime={appFrameState.onRetryRuntime}
      onStopActiveRun={appFrameState.onStopActiveRun}
      projectName={appFrameState.projectName}
      runtimeLabel={appFrameState.runtimeLabel}
      runtimeStatus={appFrameState.runtimeStatus}
      sessionStatus={appFrameState.sessionStatus}
      sessionSteps={appFrameState.sessionSteps}
      sidebarProjects={appFrameState.sidebarProjects}
      surface={appFrameState.surface}
    />
  );
}
