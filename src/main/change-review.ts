import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { promisify } from "node:util";
import type {
  ChangeCheckpointResult,
  ChangeCheckpointSnapshot,
  ChangeDiffFile,
  ChangeDiffLine,
  ChangeReviewDiffSnapshot,
  ChangeReviewFile,
  ChangeSummarySnapshot,
  CreateChangeCheckpointRequest,
  OpenChangeDiffAfterSource,
  OpenChangeDiffBeforeSource,
  OpenChangeDiffErrorCode,
  OpenChangeDiffResult,
  RestoreChangeCheckpointRequest,
  RestoreChangeCheckpointResult
} from "@shared/change-review";
import type { GitChangedFile } from "@shared/github-automation";
import { getGitStatus } from "./git-runtime";

const execFileAsync = promisify(execFile);
interface DurableChangeCheckpoint {
  checkpoint: ChangeCheckpointSnapshot;
  patch: string;
  untrackedFiles: DurableUntrackedFile[];
}

interface DurableUntrackedFile {
  contentBase64: string;
  path: string;
}

export async function getChangeSummary(projectPath: string): Promise<ChangeSummarySnapshot> {
  const status = await getGitStatus(projectPath);
  const numstat = await getGitNumstat(projectPath);
  const files = status.files.map((file) => toChangeReviewFile(file, numstat.get(file.path)));

  return {
    branch: status.branch,
    files,
    generatedAt: new Date().toISOString(),
    projectPath,
    summary: summarizeFiles(files)
  };
}

export async function getChangeReviewDiff(
  projectPath: string,
  paths?: string[]
): Promise<ChangeReviewDiffSnapshot> {
  const status = await getGitStatus(projectPath);
  const changedPaths = new Set(status.files.map((file) => file.path));
  const requestedPaths = paths && paths.length > 0
    ? paths.map(validateDiffPath).filter((path) => {
        if (!changedPaths.has(path)) {
          throw new Error(`Cannot diff a path that is not in the current change set: ${path}`);
        }

        return true;
      })
    : status.files.map((file) => file.path);
  const files: ChangeDiffFile[] = [];

  for (const path of requestedPaths.slice(0, 12)) {
    const changedFile = status.files.find((file) => file.path === path);
    files.push(await getDiffFile(projectPath, path, changedFile?.status ?? "modified"));
  }

  return {
    files,
    generatedAt: new Date().toISOString(),
    projectPath
  };
}

export async function openChangeDiff(projectPath: string, path: string): Promise<OpenChangeDiffResult> {
  let safePath: string;

  try {
    safePath = validateDiffPath(path);
  } catch (error) {
    return openChangeDiffFailure("invalid-path", error instanceof Error ? error.message : "Invalid diff path.");
  }

  let status: Awaited<ReturnType<typeof getGitStatus>>;

  try {
    status = await getGitStatus(projectPath);
  } catch (error) {
    return openChangeDiffFailure(
      "git-unavailable",
      error instanceof Error ? error.message : "Git status could not be read."
    );
  }

  const changedFile = status.files.find((file) => file.path === safePath);

  if (!changedFile) {
    return openChangeDiffFailure(
      "path-not-changed",
      `Cannot open a diff for a path that is not in the current change set: ${safePath}`
    );
  }

  let beforeSnapshot: { path: string; source: OpenChangeDiffBeforeSource };

  try {
    beforeSnapshot = await createDiffSnapshot(projectPath, safePath, "before");
  } catch (error) {
    return openChangeDiffFailure(
      "open-failed",
      error instanceof Error ? error.message : `Cannot prepare a before-version for ${safePath}.`
    );
  }
  let afterSnapshot: { path: string; source: OpenChangeDiffAfterSource };

  try {
    afterSnapshot = await resolveWorkingTreeDiffTarget(projectPath, safePath, changedFile.status);
  } catch (error) {
    return openChangeDiffFailure(
      "working-file-unavailable",
      error instanceof Error ? error.message : `Cannot read the working-tree file for ${safePath}.`
    );
  }

  const opened = await openVsCodeDiff(projectPath, beforeSnapshot.path, afterSnapshot.path);

  if (!opened.ok) {
    return opened;
  }

  return {
    afterSource: afterSnapshot.source,
    beforeSource: beforeSnapshot.source,
    ok: true,
    openedAt: new Date().toISOString(),
    path: safePath
  };
}

export async function createChangeCheckpoint(
  projectPath: string,
  request: CreateChangeCheckpointRequest
): Promise<ChangeCheckpointResult> {
  const status = await getGitStatus(projectPath);
  const { stdout: baseHead } = await execGit(projectPath, ["rev-parse", "HEAD"]);
  const { stdout: patch } = await execGit(projectPath, ["diff", "--binary", "HEAD"]).catch(() => ({ stdout: "" }));
  const untrackedFiles = await readUntrackedFiles(projectPath);
  const checkpoint: ChangeCheckpointSnapshot = {
    baseHead: baseHead.trim(),
    branch: status.branch,
    createdAt: new Date().toISOString(),
    id: `checkpoint-${randomUUID()}`,
    projectPath,
    runId: request.runId,
    status,
    type: request.type
  };

  await writeCheckpoint(projectPath, {
    checkpoint,
    patch,
    untrackedFiles
  });

  return {
    checkpoint,
    ok: true
  };
}

export function getChangeCheckpoint(checkpointId: string): ChangeCheckpointSnapshot | null {
  void checkpointId;
  return null;
}

export async function restoreChangeCheckpoint(
  projectPath: string,
  request: RestoreChangeCheckpointRequest
): Promise<RestoreChangeCheckpointResult> {
  const durableCheckpoint = await readCheckpoint(projectPath, request.checkpointId);

  try {
    await execGit(projectPath, ["reset", "--hard", durableCheckpoint.checkpoint.baseHead]);
    await removeUntrackedFilesNotInCheckpoint(projectPath, durableCheckpoint.untrackedFiles);
    await restoreUntrackedFiles(projectPath, durableCheckpoint.untrackedFiles);

    if (durableCheckpoint.patch.trim()) {
      const patchPath = join(
        await getCheckpointDir(projectPath),
        `${durableCheckpoint.checkpoint.id}.restore.patch`
      );
      await writeFile(patchPath, durableCheckpoint.patch, "utf8");
      await execGit(projectPath, ["apply", "--whitespace=nowarn", patchPath]);
    }

    return {
      restoredFiles: durableCheckpoint.checkpoint.status.files.map((file) => toChangeReviewFile(file)),
      status: "restored"
    };
  } catch (error) {
    return {
      errorMessage: error instanceof Error ? error.message : "Checkpoint restore failed.",
      restoredFiles: durableCheckpoint.checkpoint.status.files.map((file) => toChangeReviewFile(file)),
      status: "failed"
    };
  }
}

async function getGitNumstat(projectPath: string): Promise<Map<string, { additions: number; deletions: number }>> {
  const { stdout } = await execGit(projectPath, ["diff", "--numstat", "HEAD"]);
  const result = new Map<string, { additions: number; deletions: number }>();

  for (const line of stdout.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const [additions, deletions, path] = line.split("\t");
    if (!path) {
      continue;
    }

    result.set(path, {
      additions: additions === "-" ? 0 : Number(additions),
      deletions: deletions === "-" ? 0 : Number(deletions)
    });
  }

  return result;
}

async function getDiffFile(
  projectPath: string,
  path: string,
  status: GitChangedFile["status"]
): Promise<ChangeDiffFile> {
  const { stdout } = await execGit(projectPath, ["diff", "--unified=3", "--", path]).catch(() => ({ stdout: "" }));
  const lines = parseDiffLines(stdout);
  const additions = lines.filter((line) => line.kind === "added").length;
  const deletions = lines.filter((line) => line.kind === "removed").length;

  return {
    additions,
    deletions,
    language: inferLanguage(path),
    lines: lines.slice(0, 160),
    path,
    status,
    truncated: lines.length > 160
  };
}

async function execGit(
  cwd: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync("git", args, {
    cwd,
    maxBuffer: 1024 * 1024
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}

async function execGitBuffer(cwd: string, args: string[]): Promise<Buffer> {
  const result = await execFileAsync("git", args, {
    cwd,
    encoding: "buffer",
    maxBuffer: 16 * 1024 * 1024
  }) as { stdout: Buffer; stderr: Buffer };

  return result.stdout;
}

async function openVsCodeDiff(
  projectPath: string,
  beforePath: string,
  afterPath: string
): Promise<{ ok: true } | Extract<OpenChangeDiffResult, { ok: false }>> {
  const args = ["--reuse-window", "--diff", beforePath, afterPath];

  try {
    await execFileAsync("code", args, {
      cwd: projectPath,
      maxBuffer: 1024 * 64
    });
    return { ok: true };
  } catch (error) {
    if (process.platform === "darwin") {
      try {
        await execFileAsync("open", ["-a", "Visual Studio Code", "--args", ...args], {
          cwd: projectPath,
          maxBuffer: 1024 * 64
        });
        return { ok: true };
      } catch (fallbackError) {
        return openChangeDiffFailure(
          getEditorErrorCode(fallbackError),
          getOpenEditorErrorMessage(fallbackError)
        );
      }
    }

    return openChangeDiffFailure(getEditorErrorCode(error), getOpenEditorErrorMessage(error));
  }
}

async function createDiffSnapshot(
  projectPath: string,
  path: string,
  label: "after" | "before"
): Promise<{ path: string; source: OpenChangeDiffBeforeSource }> {
  const snapshotPath = await createDiffSnapshotPath(projectPath, path, label);
  const content = await execGitBuffer(projectPath, ["show", `HEAD:${path}`]).catch(() => null);

  await writeFile(snapshotPath, content ?? Buffer.alloc(0));

  return {
    path: snapshotPath,
    source: content ? "git-head" : "empty"
  };
}

async function resolveWorkingTreeDiffTarget(
  projectPath: string,
  path: string,
  status: GitChangedFile["status"]
): Promise<{ path: string; source: OpenChangeDiffAfterSource }> {
  if (status === "deleted") {
    const snapshotPath = await createDiffSnapshotPath(projectPath, path, "after");
    await writeFile(snapshotPath, Buffer.alloc(0));
    return {
      path: snapshotPath,
      source: "empty-deleted"
    };
  }

  const filePath = resolveProjectRelativePath(projectPath, path);

  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      throw new Error(`Cannot open a diff for a non-file path: ${path}`);
    }
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Cannot read the working-tree file for ${path}: ${error.message}`
        : `Cannot read the working-tree file for ${path}.`
    );
  }

  return {
    path: filePath,
    source: "working-tree"
  };
}

async function readUntrackedFiles(projectPath: string): Promise<DurableUntrackedFile[]> {
  const untrackedFiles: DurableUntrackedFile[] = [];
  const { stdout } = await execGit(projectPath, ["ls-files", "--others", "--exclude-standard", "-z"]);
  const untrackedPaths = stdout.split("\0").filter(Boolean);

  for (const untrackedPath of untrackedPaths) {
    const safePath = validateDiffPath(untrackedPath);
    const content = await readFile(join(projectPath, safePath));
    untrackedFiles.push({
      contentBase64: content.toString("base64"),
      path: safePath
    });
  }

  return untrackedFiles;
}

async function removeUntrackedFilesNotInCheckpoint(
  projectPath: string,
  checkpointFiles: DurableUntrackedFile[]
): Promise<void> {
  const checkpointPaths = new Set(checkpointFiles.map((file) => file.path));
  const { stdout } = await execGit(projectPath, ["ls-files", "--others", "--exclude-standard", "-z"]);
  const currentUntrackedPaths = stdout.split("\0").filter(Boolean);

  for (const currentPath of currentUntrackedPaths) {
    const safePath = validateDiffPath(currentPath);

    if (checkpointPaths.has(safePath)) {
      continue;
    }

    await rm(join(projectPath, safePath), { force: true, recursive: true });
  }
}

async function restoreUntrackedFiles(
  projectPath: string,
  files: DurableUntrackedFile[]
): Promise<void> {
  for (const file of files) {
    const safePath = validateDiffPath(file.path);
    const filePath = join(projectPath, safePath);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, Buffer.from(file.contentBase64, "base64"));
  }
}

async function writeCheckpoint(
  projectPath: string,
  checkpoint: DurableChangeCheckpoint
): Promise<void> {
  const dir = await getCheckpointDir(projectPath);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, `${checkpoint.checkpoint.id}.json`),
    JSON.stringify(checkpoint, null, 2),
    "utf8"
  );
}

async function readCheckpoint(
  projectPath: string,
  checkpointId: string
): Promise<DurableChangeCheckpoint> {
  validateCheckpointId(checkpointId);
  const content = await readFile(join(await getCheckpointDir(projectPath), `${checkpointId}.json`), "utf8");
  return JSON.parse(content) as DurableChangeCheckpoint;
}

async function getCheckpointDir(projectPath: string): Promise<string> {
  const { stdout } = await execGit(projectPath, ["rev-parse", "--git-common-dir"]);
  const gitCommonDir = stdout.trim();
  const resolvedGitDir = isAbsolute(gitCommonDir) ? gitCommonDir : join(projectPath, gitCommonDir);
  return join(resolvedGitDir, "gooey-pi", "checkpoints");
}

async function getChangeDiffDir(projectPath: string): Promise<string> {
  const { stdout } = await execGit(projectPath, ["rev-parse", "--git-common-dir"]);
  const gitCommonDir = stdout.trim();
  const resolvedGitDir = isAbsolute(gitCommonDir) ? gitCommonDir : join(projectPath, gitCommonDir);
  return join(resolvedGitDir, "gooey-pi", "change-diffs");
}

async function createDiffSnapshotPath(
  projectPath: string,
  path: string,
  label: "after" | "before"
): Promise<string> {
  const diffDir = await getChangeDiffDir(projectPath).catch(() => join(tmpdir(), "gooey-pi-change-diffs"));
  const safeName = basename(path).replace(/[^a-z0-9._-]/gi, "_") || "file";

  await mkdir(diffDir, { recursive: true });

  return join(diffDir, `${label}-${randomUUID()}-${safeName}`);
}

function validateCheckpointId(checkpointId: string): void {
  if (!/^checkpoint-[a-z0-9-]+$/i.test(checkpointId)) {
    throw new Error("Invalid checkpoint id.");
  }
}

function validateDiffPath(path: string): string {
  if (
    typeof path !== "string" ||
    path.length === 0 ||
    path.startsWith("/") ||
    path.startsWith("-") ||
    path.includes("\\") ||
    path.includes("\0") ||
    path.split("/").includes("..")
  ) {
    throw new Error(`Invalid diff path: ${path}`);
  }

  return path;
}

function resolveProjectRelativePath(projectPath: string, path: string): string {
  const resolvedProjectPath = resolve(projectPath);
  const resolvedPath = resolve(resolvedProjectPath, path);
  const relativePath = relative(resolvedProjectPath, resolvedPath);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Invalid diff path: ${path}`);
  }

  return resolvedPath;
}

function openChangeDiffFailure(code: OpenChangeDiffErrorCode, message: string): OpenChangeDiffResult {
  return {
    error: {
      code,
      message
    },
    ok: false
  };
}

function getEditorErrorCode(error: unknown): OpenChangeDiffErrorCode {
  return error instanceof Error && "code" in error && error.code === "ENOENT"
    ? "editor-unavailable"
    : "open-failed";
}

function getOpenEditorErrorMessage(error: unknown): string {
  if (error instanceof Error && "code" in error && error.code === "ENOENT") {
    return "VS Code could not be opened. Install the `code` command or Visual Studio Code application.";
  }

  return error instanceof Error ? error.message : "VS Code could not open the diff.";
}

function toChangeReviewFile(
  file: GitChangedFile,
  stats?: { additions: number; deletions: number }
): ChangeReviewFile {
  const totalChanged = (stats?.additions ?? 0) + (stats?.deletions ?? 0);

  return {
    ...file,
    additions: stats?.additions,
    deletions: stats?.deletions,
    impact: totalChanged > 180 ? "high" : totalChanged > 40 ? "medium" : "low",
    summary: getFileSummary(file, totalChanged)
  };
}

function getFileSummary(file: GitChangedFile, totalChanged: number): string {
  if (file.status === "untracked") {
    return "New file not yet tracked by git.";
  }

  if (file.status === "unmerged") {
    return "File has merge conflict state and needs recovery before automation continues.";
  }

  if (totalChanged === 0) {
    return "Metadata or binary change detected.";
  }

  return `${totalChanged} changed lines in ${file.status} file.`;
}

function summarizeFiles(files: ChangeReviewFile[]): string {
  if (files.length === 0) {
    return "No local changes are currently detected.";
  }

  const highImpactCount = files.filter((file) => file.impact === "high").length;

  if (highImpactCount > 0) {
    return `${files.length} changed files, including ${highImpactCount} high-impact file${highImpactCount === 1 ? "" : "s"}.`;
  }

  return `${files.length} changed file${files.length === 1 ? "" : "s"} ready for review.`;
}

function parseDiffLines(diff: string): ChangeDiffLine[] {
  const lines: ChangeDiffLine[] = [];
  let nextOldLine = 0;
  let nextNewLine = 0;

  for (const line of diff.split("\n")) {
    if (line.startsWith("@@")) {
      const match = line.match(/-(\d+)(?:,\d+)?\s+\+(\d+)/);
      nextOldLine = match ? Number(match[1]) : 0;
      nextNewLine = match ? Number(match[2]) : 0;
      continue;
    }

    if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("diff --git") || line.startsWith("index ")) {
      continue;
    }

    if (line.startsWith("+")) {
      lines.push({ content: line.slice(1), kind: "added", lineNumber: nextNewLine++ });
      continue;
    }

    if (line.startsWith("-")) {
      lines.push({ content: line.slice(1), kind: "removed", lineNumber: nextOldLine++ });
      continue;
    }

    lines.push({ content: line.startsWith(" ") ? line.slice(1) : line, kind: "context", lineNumber: nextNewLine++ });
    nextOldLine += 1;
  }

  return lines;
}

function inferLanguage(path: string): string | undefined {
  const extension = path.split(".").at(-1);

  switch (extension) {
    case "css":
    case "json":
    case "md":
    case "tsx":
    case "ts":
      return extension;
    default:
      return undefined;
  }
}
