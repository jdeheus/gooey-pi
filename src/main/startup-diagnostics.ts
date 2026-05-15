import { app } from "electron";
import type { PiRuntimeSnapshot } from "@shared/pi";
import type { ProjectFolderSnapshot } from "@shared/project";
import { eventStream } from "./event-stream";
import { ensurePiRuntimeReady } from "./pi-runtime";
import { restoreProjectFolder } from "./project-folders";

let hasRun = false;

export async function runStartupDiagnostics(): Promise<void> {
  if (hasRun) {
    return;
  }

  hasRun = true;

  eventStream.recordDiagnostic({
    name: "Electron app",
    status: "pass",
    message: "Electron main process started.",
    details: {
      appVersion: app.getVersion(),
      platform: process.platform,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron
    }
  });

  const [project, runtime] = await Promise.all([restoreProjectFolder(), ensurePiRuntimeReady()]);

  recordProjectDiagnostic(project);
  recordRuntimeDiagnostic(runtime);
}

function recordProjectDiagnostic(snapshot: ProjectFolderSnapshot): void {
  if (snapshot.error) {
    eventStream.recordError(snapshot.error);
  }

  if (!snapshot.state.path) {
    eventStream.recordDiagnostic({
      name: "Last project folder",
      status: "warn",
      message: "No project folder has been selected yet.",
      details: snapshot
    });
    return;
  }

  eventStream.recordDiagnostic({
    name: "Last project folder",
    status: snapshot.state.valid ? "pass" : "fail",
    message: snapshot.state.valid
      ? "Last project folder restored successfully."
      : "Last project folder could not be restored.",
    details: snapshot
  });
}

function recordRuntimeDiagnostic(runtime: PiRuntimeSnapshot): void {
  if (runtime.error) {
    eventStream.recordError(runtime.error);
  }

  eventStream.recordDiagnostic({
    name: "Pi runtime",
    status: runtime.status === "ready" ? "pass" : "fail",
    message: runtime.status === "ready" ? "Pi SDK loaded successfully." : "Pi SDK is not ready.",
    details: runtime
  });
}
