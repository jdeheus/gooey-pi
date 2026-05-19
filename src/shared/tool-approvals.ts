export type ToolPermissionCategory =
  | "destructive"
  | "filesystem"
  | "git"
  | "github"
  | "network"
  | "shell";

export type ToolPermissionRisk = "destructive" | "elevated" | "safe";

export type ToolPermissionPolicyMode = "allow" | "ask" | "block";

export type ToolApprovalDecision = "approved" | "denied";

export type ToolApprovalDecisionStatus =
  | "approved"
  | "automatic"
  | "denied"
  | "expired"
  | "remembered";

export interface ToolApprovalRememberedRule {
  category: ToolPermissionCategory;
  createdAt: string;
  id: string;
  label: string;
  mode: Extract<ToolPermissionPolicyMode, "allow" | "ask">;
  scope: string;
}

export interface ToolApprovalAuditEntry {
  actionLabel: string;
  category: ToolPermissionCategory;
  decision: ToolApprovalDecisionStatus;
  id: string;
  requester?: string;
  risk: ToolPermissionRisk;
  timestampLabel: string;
}

export interface ToolApprovalRequest {
  actionLabel: string;
  canRemember?: boolean;
  category: ToolPermissionCategory;
  commandPreview?: string;
  expiresAtLabel?: string;
  id: string;
  projectLabel?: string;
  requester?: string;
  risk: ToolPermissionRisk;
  status: "expired" | "pending" | "superseded";
  summary: string;
  targetLabel?: string;
  title: string;
}

export interface ToolApprovalBlockedState {
  actionLabel: string;
  category: ToolPermissionCategory;
  detail?: string;
  id: string;
  recoveryActions: Array<{
    id: string;
    label: string;
  }>;
  risk: ToolPermissionRisk;
  summary: string;
  title: string;
}

export interface ToolApprovalResponseRequest {
  decision: ToolApprovalDecision;
  rememberChoice?: boolean;
  requestId: string;
}

export interface ToolApprovalResponseResult {
  auditEntry?: ToolApprovalAuditEntry;
  errorMessage?: string;
  ok: boolean;
}

export const DEFAULT_PERMISSION_POLICY: Record<ToolPermissionCategory, ToolPermissionPolicyMode> = {
  filesystem: "allow",
  shell: "ask",
  network: "ask",
  git: "ask",
  github: "ask",
  destructive: "ask"
};

export const DEFAULT_APPROVAL_AUDIT: ToolApprovalAuditEntry[] = [
  {
    actionLabel: "Read renderer files",
    category: "filesystem",
    decision: "automatic",
    id: "approval-audit-read-renderer",
    requester: "Pi",
    risk: "safe",
    timestampLabel: "now"
  },
  {
    actionLabel: "Push branch to GitHub",
    category: "github",
    decision: "denied",
    id: "approval-audit-denied-push",
    requester: "Jon",
    risk: "elevated",
    timestampLabel: "12m ago"
  },
  {
    actionLabel: "Delete generated files",
    category: "destructive",
    decision: "expired",
    id: "approval-audit-expired-delete",
    requester: "Pi",
    risk: "destructive",
    timestampLabel: "25m ago"
  }
];
