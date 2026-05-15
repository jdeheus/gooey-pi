import type { AppError } from "./errors";
import type { SessionSnapshot } from "./session";

export type PiRuntimeStatus = "unchecked" | "starting" | "ready" | "errored";

export interface PiRuntimeSnapshot {
  status: PiRuntimeStatus;
  packageName: "@earendil-works/pi-coding-agent";
  packageVersion: "0.74.0";
  checkedAt: string | null;
  errorId: string | null;
  error: AppError | null;
}

export interface CreateAgentSessionResult {
  session: SessionSnapshot;
  runtime: PiRuntimeSnapshot;
  error: AppError | null;
}
