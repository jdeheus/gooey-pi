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
  requireDestructiveApproval: boolean;
  showTierTwoDetails: boolean;
}

export interface RuntimeSettingsSnapshot {
  agentBehavior: AgentBehaviorSettings;
  approvals: ApprovalSettings;
  models: ModelRoleSettings;
  operatorProfile: OperatorProfile;
  updatedAt: string | null;
}

export type RuntimeSettingsPatch = Partial<{
  agentBehavior: Partial<AgentBehaviorSettings>;
  approvals: Partial<ApprovalSettings>;
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
    requireDestructiveApproval: true,
    showTierTwoDetails: false
  },
  updatedAt: null
};

export function mergeRuntimeSettings(
  current: RuntimeSettingsSnapshot,
  patch: RuntimeSettingsPatch
): RuntimeSettingsSnapshot {
  return {
    operatorProfile: patch.operatorProfile ?? current.operatorProfile,
    models: {
      ...current.models,
      ...patch.models
    },
    agentBehavior: {
      ...current.agentBehavior,
      ...patch.agentBehavior
    },
    approvals: {
      ...current.approvals,
      ...patch.approvals
    },
    updatedAt: new Date().toISOString()
  };
}
