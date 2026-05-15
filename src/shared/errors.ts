export type AppErrorCode =
  | "UNKNOWN"
  | "IPC_UNAVAILABLE"
  | "FILESYSTEM_READ_FAILED"
  | "FILESYSTEM_WRITE_FAILED"
  | "AGENT_SESSION_CREATE_FAILED"
  | "AGENT_SESSION_DISPOSE_FAILED"
  | "AGENT_SESSION_PROMPT_FAILED"
  | "PI_RUNTIME_START_FAILED"
  | "PI_RUNTIME_UNAVAILABLE"
  | "PROJECT_FOLDER_INVALID"
  | "PROJECT_FOLDER_UNAVAILABLE"
  | "SESSION_BUSY"
  | "SESSION_UNAVAILABLE"
  | "SDK_UNAVAILABLE";

export interface AppError {
  id: string;
  code: AppErrorCode;
  message: string;
  details?: unknown;
  createdAt: string;
  recoverable: boolean;
}

export function createAppError(input: {
  code: AppErrorCode;
  message: string;
  details?: unknown;
  recoverable?: boolean;
}): AppError {
  return {
    id: `err-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    code: input.code,
    message: input.message,
    details: input.details,
    createdAt: new Date().toISOString(),
    recoverable: input.recoverable ?? true
  };
}
