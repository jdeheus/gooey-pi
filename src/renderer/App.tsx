import { AppFrame } from "@renderer/surfaces/app-frame";
import { useRendererAppFrameState } from "@renderer/app-state";

export function App() {
  const appFrameState = useRendererAppFrameState();

  return (
    <AppFrame
      chatItems={appFrameState.chatItems}
      diagnosticsEvents={appFrameState.diagnosticsEvents}
      hasProjects={appFrameState.hasProjects}
      isRefreshing={appFrameState.isRefreshing}
      modelCatalog={appFrameState.modelCatalog}
      onClearDiagnostics={appFrameState.onClearDiagnostics}
      onCopySessionInfo={appFrameState.onCopySessionInfo}
      onOpenDiagnostics={appFrameState.onOpenDiagnostics}
      onOpenProject={appFrameState.onOpenProject}
      onOpenSettings={appFrameState.onOpenSettings}
      onReconnect={appFrameState.onReconnect}
      onRetryRuntime={appFrameState.onRetryRuntime}
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
