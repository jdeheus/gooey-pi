import type { ChatMentionOption } from "./chat";

export type ProjectContextIndexStatus = "error" | "partial" | "ready";

export type ProjectContextReadableFileKind =
  | "config"
  | "documentation"
  | "source"
  | "story"
  | "test"
  | "unknown";

export interface ProjectContextReadableFile {
  description?: string;
  id: string;
  kind: ProjectContextReadableFileKind;
  language?: string;
  lastModifiedAt?: string;
  lineCount?: number;
  mimeType?: string;
  projectRelativePath: string;
  sizeBytes?: number;
}

export interface ProjectContextIndexError {
  code: string;
  message: string;
  path?: string;
}

export interface ProjectContextIndexMention extends ChatMentionOption {
  kind: "file";
  projectRelativePath: string;
  score?: number;
  sizeBytes?: number;
}

export interface ProjectContextIndexResult {
  errors?: ProjectContextIndexError[];
  indexedAt: string;
  mentions: ProjectContextIndexMention[];
  projectId: string;
  projectPath: string;
  readableFiles: ProjectContextReadableFile[];
  status: ProjectContextIndexStatus;
}

export function createMentionOptionsFromContextIndex(
  index: Pick<ProjectContextIndexResult, "readableFiles">
): ProjectContextIndexMention[] {
  return index.readableFiles.map((file) => ({
    description: createReadableFileDescription(file),
    id: file.id,
    kind: "file",
    label: getPathName(file.projectRelativePath),
    path: file.projectRelativePath,
    projectRelativePath: file.projectRelativePath,
    sizeBytes: file.sizeBytes
  }));
}

function createReadableFileDescription(file: ProjectContextReadableFile): string {
  const details = [
    file.kind,
    file.language,
    file.lineCount === undefined ? undefined : `${file.lineCount} lines`
  ].filter((detail): detail is string => Boolean(detail));

  return details.length > 0 ? details.join(" · ") : file.projectRelativePath;
}

function getPathName(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}
