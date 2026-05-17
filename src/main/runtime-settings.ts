import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { app } from "electron";
import {
  DEFAULT_RUNTIME_SETTINGS,
  mergeRuntimeSettings,
  type AgentBehaviorSettings,
  type ApprovalSettings,
  type ModelRoleSettings,
  type RuntimeSettingsPatch,
  type RuntimeSettingsSnapshot
} from "@shared/runtime-settings";

const storageFileName = "runtime-settings.json";

function storagePath(): string {
  return join(app.getPath("userData"), storageFileName);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeModelSettings(value: unknown): ModelRoleSettings {
  const source = isObject(value) ? value : {};
  return {
    primaryModel: readString(source.primaryModel, DEFAULT_RUNTIME_SETTINGS.models.primaryModel),
    agentModel: readString(source.agentModel, DEFAULT_RUNTIME_SETTINGS.models.agentModel),
    fallbackModel: readString(source.fallbackModel, DEFAULT_RUNTIME_SETTINGS.models.fallbackModel)
  };
}

function normalizeAgentBehavior(value: unknown): AgentBehaviorSettings {
  const source = isObject(value) ? value : {};
  const subagentPolicy = readString(
    source.subagentPolicy,
    DEFAULT_RUNTIME_SETTINGS.agentBehavior.subagentPolicy
  );
  const reviewPreference = readString(
    source.reviewPreference,
    DEFAULT_RUNTIME_SETTINGS.agentBehavior.reviewPreference
  );

  return {
    subagentPolicy:
      subagentPolicy === "ask-first" || subagentPolicy === "off" || subagentPolicy === "automatic"
        ? subagentPolicy
        : DEFAULT_RUNTIME_SETTINGS.agentBehavior.subagentPolicy,
    parallelism: Math.max(
      1,
      Math.min(6, Math.round(readNumber(source.parallelism, DEFAULT_RUNTIME_SETTINGS.agentBehavior.parallelism)))
    ),
    reviewPreference:
      reviewPreference === "diffs-on-request" || reviewPreference === "manual-review" || reviewPreference === "summaries"
        ? reviewPreference
        : DEFAULT_RUNTIME_SETTINGS.agentBehavior.reviewPreference
  };
}

function normalizeApprovalSettings(value: unknown): ApprovalSettings {
  const source = isObject(value) ? value : {};
  const mode = readString(source.mode, DEFAULT_RUNTIME_SETTINGS.approvals.mode);

  return {
    mode:
      mode === "ask" || mode === "manual-review" || mode === "auto-approve-safe"
        ? mode
        : DEFAULT_RUNTIME_SETTINGS.approvals.mode,
    requireDestructiveApproval: readBoolean(
      source.requireDestructiveApproval,
      DEFAULT_RUNTIME_SETTINGS.approvals.requireDestructiveApproval
    ),
    showTierTwoDetails: readBoolean(
      source.showTierTwoDetails,
      DEFAULT_RUNTIME_SETTINGS.approvals.showTierTwoDetails
    )
  };
}

function normalizeRuntimeSettings(value: unknown): RuntimeSettingsSnapshot {
  const source = isObject(value) ? value : {};
  const operatorProfile = readString(source.operatorProfile, DEFAULT_RUNTIME_SETTINGS.operatorProfile);

  return {
    operatorProfile:
      operatorProfile === "technical-reviewer" || operatorProfile === "engineer" || operatorProfile === "ai-operator"
        ? operatorProfile
        : DEFAULT_RUNTIME_SETTINGS.operatorProfile,
    models: normalizeModelSettings(source.models),
    agentBehavior: normalizeAgentBehavior(source.agentBehavior),
    approvals: normalizeApprovalSettings(source.approvals),
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null
  };
}

export async function getRuntimeSettings(): Promise<RuntimeSettingsSnapshot> {
  try {
    const raw = await readFile(storagePath(), "utf8");
    return normalizeRuntimeSettings(JSON.parse(raw));
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT") {
      return DEFAULT_RUNTIME_SETTINGS;
    }

    return DEFAULT_RUNTIME_SETTINGS;
  }
}

export async function updateRuntimeSettings(
  patch: RuntimeSettingsPatch
): Promise<RuntimeSettingsSnapshot> {
  const current = await getRuntimeSettings();
  const next = normalizeRuntimeSettings(mergeRuntimeSettings(current, patch));

  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(storagePath(), JSON.stringify(next, null, 2), "utf8");

  return next;
}
