import { readdir, readFile, stat } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import {
  createMentionOptionsFromContextIndex,
  type ProjectContextIndexError,
  type ProjectContextIndexResult,
  type ProjectContextReadableFile,
  type ProjectContextReadableFileKind
} from "@shared/context-index";

const MAX_CONTEXT_FILES = 80;
const MAX_CONTEXT_DEPTH = 5;
const MAX_LINE_COUNT_BYTES = 160_000;
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".turbo",
  ".vite",
  "coverage",
  "dist",
  "node_modules",
  "storybook-static"
]);

const READABLE_EXTENSIONS = new Map<string, { kind: ProjectContextReadableFileKind; language?: string }>([
  [".css", { kind: "source", language: "css" }],
  [".html", { kind: "source", language: "html" }],
  [".js", { kind: "source", language: "javascript" }],
  [".json", { kind: "config", language: "json" }],
  [".jsx", { kind: "source", language: "javascript" }],
  [".md", { kind: "documentation", language: "markdown" }],
  [".mdx", { kind: "documentation", language: "mdx" }],
  [".ts", { kind: "source", language: "typescript" }],
  [".tsx", { kind: "source", language: "typescript" }],
  [".toml", { kind: "config", language: "toml" }],
  [".yaml", { kind: "config", language: "yaml" }],
  [".yml", { kind: "config", language: "yaml" }]
]);

export async function createProjectContextIndex(input: {
  projectId: string;
  projectPath: string;
}): Promise<ProjectContextIndexResult> {
  const indexedAt = new Date().toISOString();
  const errors: ProjectContextIndexError[] = [];
  const readableFiles: ProjectContextReadableFile[] = [];

  await collectReadableFiles({
    depth: 0,
    errors,
    projectPath: input.projectPath,
    readableFiles,
    rootPath: input.projectPath
  });

  const sortedFiles = readableFiles
    .sort((left, right) => scoreContextFile(left) - scoreContextFile(right))
    .slice(0, MAX_CONTEXT_FILES);
  const status = errors.length > 0 ? "partial" : "ready";

  return {
    errors: errors.length > 0 ? errors : undefined,
    indexedAt,
    mentions: createMentionOptionsFromContextIndex({ readableFiles: sortedFiles }),
    projectId: input.projectId,
    projectPath: input.projectPath,
    readableFiles: sortedFiles,
    status
  };
}

async function collectReadableFiles(input: {
  depth: number;
  errors: ProjectContextIndexError[];
  projectPath: string;
  readableFiles: ProjectContextReadableFile[];
  rootPath: string;
}): Promise<void> {
  if (input.depth > MAX_CONTEXT_DEPTH || input.readableFiles.length >= MAX_CONTEXT_FILES * 2) {
    return;
  }

  let entries: Dirent[];

  try {
    entries = await readdir(input.projectPath, { withFileTypes: true });
  } catch (error) {
    input.errors.push({
      code: "READ_FAILED",
      message: error instanceof Error ? error.message : "Could not read project folder.",
      path: relative(input.rootPath, input.projectPath)
    });
    return;
  }

  for (const entry of entries) {
    if (input.readableFiles.length >= MAX_CONTEXT_FILES * 2) {
      return;
    }

    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        await collectReadableFiles({
          ...input,
          depth: input.depth + 1,
          projectPath: join(input.projectPath, entry.name)
        });
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const absolutePath = join(input.projectPath, entry.name);
    const relativePath = normalizeProjectPath(relative(input.rootPath, absolutePath));
    const metadata = getReadableFileMetadata(relativePath);

    if (!metadata) {
      continue;
    }

    const fileStat = await stat(absolutePath).catch(() => null);

    input.readableFiles.push({
      id: `context-file-${relativePath.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      kind: metadata.kind,
      language: metadata.language,
      lastModifiedAt: fileStat?.mtime.toISOString(),
      lineCount: await countLines(absolutePath, fileStat?.size ?? 0),
      projectRelativePath: relativePath,
      sizeBytes: fileStat?.size
    });
  }
}

function getReadableFileMetadata(
  projectRelativePath: string
): { kind: ProjectContextReadableFileKind; language?: string } | null {
  const extension = extname(projectRelativePath).toLowerCase();
  const metadata = READABLE_EXTENSIONS.get(extension);

  if (!metadata) {
    return null;
  }

  if (projectRelativePath.endsWith(".stories.tsx") || projectRelativePath.endsWith(".stories.ts")) {
    return { ...metadata, kind: "story" };
  }

  if (projectRelativePath.endsWith(".test.tsx") || projectRelativePath.endsWith(".test.ts")) {
    return { ...metadata, kind: "test" };
  }

  return metadata;
}

async function countLines(path: string, sizeBytes: number): Promise<number | undefined> {
  if (sizeBytes > MAX_LINE_COUNT_BYTES) {
    return undefined;
  }

  const raw = await readFile(path, "utf8").catch(() => null);

  if (raw === null) {
    return undefined;
  }

  return raw.split(/\r\n|\r|\n/).length;
}

function scoreContextFile(file: ProjectContextReadableFile): number {
  const name = basename(file.projectRelativePath);
  const kindScore: Record<ProjectContextReadableFileKind, number> = {
    config: 1,
    documentation: 2,
    source: 3,
    story: 4,
    test: 5,
    unknown: 6
  };

  if (name === "package.json") {
    return 0;
  }

  return kindScore[file.kind] * 10_000 + file.projectRelativePath.length;
}

function normalizeProjectPath(path: string): string {
  return path.split(/[\\/]+/).filter(Boolean).join("/");
}
