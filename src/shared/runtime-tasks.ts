import type { AppError } from "./errors";
import type { AgentSessionSubmitIntent, AgentSessionSubmitModel, PiModelThinkingLevel } from "./pi";
import type {
  AgentBehaviorSettings,
  ApprovalSettings,
  ModelRoleSettings,
  OperatorProfile
} from "./runtime-settings";

export type RuntimeTaskId = string;

export type RuntimeRunStatus =
  | "queued"
  | "running"
  | "merging"
  | "succeeded"
  | "failed"
  | "canceled";

export type RuntimeChildTaskStatus =
  | "queued"
  | "running"
  | "blocked"
  | "succeeded"
  | "failed"
  | "canceled"
  | "merged";

export type RuntimeTaskKind = "parent-run" | "agent" | "subagent";

export type RuntimeTaskLifecycleStage =
  | "created"
  | "queued"
  | "started"
  | "progress"
  | "blocked"
  | "failed"
  | "canceled"
  | "succeeded"
  | "merged";

export interface RuntimeModelMetadata {
  role: "primary" | "agent" | "fallback";
  modelId: string;
  thinkingLevel?: PiModelThinkingLevel;
  source: "request" | "settings" | "fallback";
}

export interface RuntimePolicyMetadata {
  operatorProfile: OperatorProfile;
  subagentPolicy: AgentBehaviorSettings["subagentPolicy"];
  parallelism: AgentBehaviorSettings["parallelism"];
  reviewPreference: AgentBehaviorSettings["reviewPreference"];
  approvalMode: ApprovalSettings["mode"];
  requireDestructiveApproval: ApprovalSettings["requireDestructiveApproval"];
  showTierTwoDetails: ApprovalSettings["showTierTwoDetails"];
}

export interface RuntimeTaskMetadata {
  models: {
    primary: RuntimeModelMetadata;
    agent: RuntimeModelMetadata;
    fallback: RuntimeModelMetadata;
  };
  policy: RuntimePolicyMetadata;
  settingsUpdatedAt: string | null;
}

export interface RuntimeTaskFailure {
  errorId: string;
  code: AppError["code"];
  message: string;
  recoverable: boolean;
  details?: unknown;
}

export interface RuntimeTaskLifecycleEvent {
  id: string;
  taskId: RuntimeTaskId;
  stage: RuntimeTaskLifecycleStage;
  status: RuntimeRunStatus | RuntimeChildTaskStatus;
  timestamp: string;
  summary: string;
  rawEventId?: string;
  failure?: RuntimeTaskFailure;
}

export interface RuntimeMergeSummary {
  id: string;
  parentRunId: RuntimeTaskId;
  createdAt: string;
  completedAt: string | null;
  status: "pending" | "complete" | "failed" | "canceled";
  childTaskIds: RuntimeTaskId[];
  mergedChildTaskIds: RuntimeTaskId[];
  failedChildTaskIds: RuntimeTaskId[];
  summary: string | null;
  failure?: RuntimeTaskFailure;
}

export interface RuntimeChildTask {
  id: RuntimeTaskId;
  parentRunId: RuntimeTaskId;
  kind: "agent" | "subagent";
  label: string;
  status: RuntimeChildTaskStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  model: RuntimeModelMetadata;
  policy: RuntimePolicyMetadata;
  progress: {
    currentStep: string | null;
    completedSteps: number;
    totalSteps: number | null;
  };
  failure: RuntimeTaskFailure | null;
  mergeSummaryId: string | null;
  lifecycle: RuntimeTaskLifecycleEvent[];
}

export interface RuntimeParentRun {
  id: RuntimeTaskId;
  sessionId: string;
  projectPath: string;
  kind: "parent-run";
  intent: AgentSessionSubmitIntent;
  status: RuntimeRunStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  promptPreview: string;
  model: RuntimeModelMetadata;
  metadata: RuntimeTaskMetadata;
  childTaskIds: RuntimeTaskId[];
  mergeSummary: RuntimeMergeSummary | null;
  failure: RuntimeTaskFailure | null;
  lifecycle: RuntimeTaskLifecycleEvent[];
}

export interface RuntimeTaskGraphSnapshot {
  activeRunId: RuntimeTaskId | null;
  runs: RuntimeParentRun[];
  childTasks: RuntimeChildTask[];
  updatedAt: string | null;
}

export function createRuntimeTaskFailure(error: AppError): RuntimeTaskFailure {
  return {
    errorId: error.id,
    code: error.code,
    message: error.message,
    recoverable: error.recoverable,
    ...(error.details !== undefined ? { details: error.details } : {})
  };
}

export function createRuntimeTaskMetadata(input: {
  requestModel?: AgentSessionSubmitModel;
  settings: {
    agentBehavior: AgentBehaviorSettings;
    approvals: ApprovalSettings;
    models: ModelRoleSettings;
    operatorProfile: OperatorProfile;
    updatedAt: string | null;
  };
}): RuntimeTaskMetadata {
  const requestModel = input.requestModel;
  const primaryModelId = requestModel?.modelId ?? input.settings.models.primaryModel;

  return {
    models: {
      primary: {
        role: "primary",
        modelId: primaryModelId,
        ...(requestModel?.thinkingLevel ? { thinkingLevel: requestModel.thinkingLevel } : {}),
        source: requestModel ? "request" : "settings"
      },
      agent: {
        role: "agent",
        modelId: input.settings.models.agentModel,
        source: "settings"
      },
      fallback: {
        role: "fallback",
        modelId: input.settings.models.fallbackModel,
        source: "settings"
      }
    },
    policy: {
      operatorProfile: input.settings.operatorProfile,
      subagentPolicy: input.settings.agentBehavior.subagentPolicy,
      parallelism: input.settings.agentBehavior.parallelism,
      reviewPreference: input.settings.agentBehavior.reviewPreference,
      approvalMode: input.settings.approvals.mode,
      requireDestructiveApproval: input.settings.approvals.requireDestructiveApproval,
      showTierTwoDetails: input.settings.approvals.showTierTwoDetails
    },
    settingsUpdatedAt: input.settings.updatedAt
  };
}
