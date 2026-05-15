export type AppErrorCode =
  | "UNKNOWN"
  | "IPC_UNAVAILABLE"
  | "PROJECT_FOLDER_INVALID"
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
