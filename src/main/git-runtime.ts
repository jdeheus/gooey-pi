import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  GitChangedFile,
  GitChangedFileStatus,
  GitStatusSnapshot
} from "@shared/github-automation";

const execFileAsync = promisify(execFile);

const statusMap: Record<string, GitChangedFileStatus> = {
  A: "added",
  C: "copied",
  D: "deleted",
  M: "modified",
  R: "renamed",
  T: "type-changed",
  U: "unmerged",
  "?": "untracked"
};

export async function getGitStatus(projectPath: string): Promise<GitStatusSnapshot> {
  const { stdout: branchStdout } = await execGit(projectPath, [
    "status",
    "--porcelain=v1",
    "-b"
  ]);

  const lines = branchStdout.split("\n").filter(Boolean);
  const branchLine = lines[0] ?? "";
  const fileLines = lines.slice(1);
  const branch = parseBranchName(branchLine);
  const { stdout: remoteStdout } = branch
    ? await execGit(projectPath, [
        "config",
        "--get",
        `branch.${branch}.remote`
      ]).catch(() => ({ stdout: "" }))
    : { stdout: "" };
  const { ahead, behind } = parseAheadBehind(branchLine);
  const files = fileLines.map(parseStatusLine);

  return {
    ahead,
    behind,
    branch,
    checkedAt: new Date().toISOString(),
    clean: files.length === 0,
    files,
    projectPath,
    remote: remoteStdout.trim() || null
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

function parseBranchName(line: string): string | null {
  const match = line.match(/^##\s+([^\s.]+|\S+?)(?:\.\.\.|$)/);
  return match?.[1] ?? null;
}

function parseAheadBehind(line: string): { ahead: number; behind: number } {
  const aheadMatch = line.match(/ahead\s+(\d+)/);
  const behindMatch = line.match(/behind\s+(\d+)/);

  return {
    ahead: aheadMatch ? Number(aheadMatch[1]) : 0,
    behind: behindMatch ? Number(behindMatch[1]) : 0
  };
}

function parseStatusLine(line: string): GitChangedFile {
  const statusCode = line.slice(0, 2);
  const rawPath = line.slice(3).trim();
  const path = rawPath.includes(" -> ") ? rawPath.split(" -> ").at(-1) ?? rawPath : rawPath;
  const status = statusMap[statusCode.trim()[0] ?? ""] ?? "modified";

  return {
    path,
    status
  };
}
