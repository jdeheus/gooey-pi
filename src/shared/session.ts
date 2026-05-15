export type SessionStatus =
  | "idle"
  | "ready"
  | "running"
  | "aborting"
  | "errored"
  | "disposed"
  | "stopped";

export interface SessionSnapshot {
  id: string | null;
  status: SessionStatus;
  projectPath: string | null;
}
