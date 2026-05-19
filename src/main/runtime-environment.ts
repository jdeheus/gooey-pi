const macosToolPathCandidates = [
  "/opt/homebrew/bin",
  "/opt/homebrew/sbin",
  "/usr/local/bin",
  "/usr/local/sbin",
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin"
];

let toolPathConfigured = false;

export function ensureRuntimeToolPath(): string {
  if (toolPathConfigured) {
    return process.env.PATH ?? "";
  }

  const existingPath = process.env.PATH ?? "";
  const pathEntries = existingPath.split(":").filter(Boolean);
  const normalizedEntries = new Set(pathEntries);
  const missingCandidates = macosToolPathCandidates.filter((entry) => !normalizedEntries.has(entry));

  process.env.PATH = [...missingCandidates, ...pathEntries].join(":");
  toolPathConfigured = true;

  return process.env.PATH;
}
