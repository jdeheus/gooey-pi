import {
  DEFAULT_PERMISSION_POLICY,
  type ToolApprovalRememberedRule,
  type ToolPermissionCategory,
  type ToolPermissionPolicyMode
} from "./tool-approvals";

export type OperatorProfile = "ai-operator" | "technical-reviewer" | "engineer";

export type SubagentPolicy = "automatic" | "ask-first" | "off";

export type ReviewPreference = "summaries" | "diffs-on-request" | "manual-review";

export type ApprovalMode = "ask" | "auto-approve-safe" | "manual-review";

export interface ModelRoleSettings {
  agentModel: string;
  fallbackModel: string;
  primaryModel: string;
}

export interface AgentBehaviorSettings {
  parallelism: number;
  reviewPreference: ReviewPreference;
  subagentPolicy: SubagentPolicy;
}

export interface ApprovalSettings {
  mode: ApprovalMode;
  permissionPolicy: Record<ToolPermissionCategory, ToolPermissionPolicyMode>;
  rememberedApprovals: ToolApprovalRememberedRule[];
  requireDestructiveApproval: boolean;
  showTierTwoDetails: boolean;
}

export interface GitHubAutomationSettings {
  autoBranch: boolean;
  autoCommit: boolean;
  autoPull: boolean;
  autoPush: boolean;
  openPullRequest: boolean;
}

export interface RuntimeSettingsSnapshot {
  agentBehavior: AgentBehaviorSettings;
  approvals: ApprovalSettings;
  githubAutomation: GitHubAutomationSettings;
  models: ModelRoleSettings;
  operatorProfile: OperatorProfile;
  updatedAt: string | null;
}

export type RuntimeSettingsPatch = Partial<{
  agentBehavior: Partial<AgentBehaviorSettings>;
  approvals: Partial<ApprovalSettings>;
  githubAutomation: Partial<GitHubAutomationSettings>;
  models: Partial<ModelRoleSettings>;
  operatorProfile: OperatorProfile;
}>;

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettingsSnapshot = {
  operatorProfile: "ai-operator",
  models: {
    primaryModel: "openai-codex/gpt-5.5:medium",
    agentModel: "deepseek/deepseek-coder:medium",
    fallbackModel: "openai-codex/gpt-5.2:medium"
  },
  agentBehavior: {
    subagentPolicy: "automatic",
    parallelism: 3,
    reviewPreference: "summaries"
  },
  approvals: {
    mode: "auto-approve-safe",
    permissionPolicy: DEFAULT_PERMISSION_POLICY,
    rememberedApprovals: [],
    requireDestructiveApproval: true,
    showTierTwoDetails: false
  },
  githubAutomation: {
    autoPull: true,
    autoBranch: true,
    autoCommit: false,
    autoPush: false,
    openPullRequest: true
  },
  updatedAt: null
};

export function mergeRuntimeSettings(
  current: RuntimeSettingsSnapshot,
  patch: RuntimeSettingsPatch
): RuntimeSettingsSnapshot {
  return {
    operatorProfile: patch.operatorProfile ?? current.operatorProfile ?? DEFAULT_RUNTIME_SETTINGS.operatorProfile,
    models: {
      ...DEFAULT_RUNTIME_SETTINGS.models,
      ...current.models,
      ...patch.models
    },
    agentBehavior: {
      ...DEFAULT_RUNTIME_SETTINGS.agentBehavior,
      ...current.agentBehavior,
      ...patch.agentBehavior
    },
    approvals: {
      ...DEFAULT_RUNTIME_SETTINGS.approvals,
      ...current.approvals,
      ...patch.approvals,
      permissionPolicy: {
        ...DEFAULT_RUNTIME_SETTINGS.approvals.permissionPolicy,
        ...current.approvals?.permissionPolicy,
        ...patch.approvals?.permissionPolicy,
        destructive: "ask"
      },
      rememberedApprovals:
        patch.approvals?.rememberedApprovals ??
        current.approvals?.rememberedApprovals ??
        DEFAULT_RUNTIME_SETTINGS.approvals.rememberedApprovals
    },
    githubAutomation: {
      ...DEFAULT_RUNTIME_SETTINGS.githubAutomation,
      ...current.githubAutomation,
      ...patch.githubAutomation
    },
    updatedAt: new Date().toISOString()
  };
}
