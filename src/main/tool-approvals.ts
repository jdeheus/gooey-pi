import {
  DEFAULT_APPROVAL_AUDIT,
  type ToolApprovalAuditEntry,
  type ToolApprovalRequest,
  type ToolApprovalResponseRequest,
  type ToolApprovalResponseResult
} from "@shared/tool-approvals";

const approvalAuditTrail: ToolApprovalAuditEntry[] = [...DEFAULT_APPROVAL_AUDIT];
const pendingApprovalRequests = new Map<string, ToolApprovalRequest>();

export function getToolApprovalAuditTrail(): ToolApprovalAuditEntry[] {
  return [...approvalAuditTrail];
}

export function registerToolApprovalRequest(request: ToolApprovalRequest): void {
  if (request.status === "pending") {
    pendingApprovalRequests.set(request.id, request);
    return;
  }

  pendingApprovalRequests.delete(request.id);
}

export function recordToolApprovalAuditEntry(entry: ToolApprovalAuditEntry): void {
  approvalAuditTrail.unshift(entry);
}

export function respondToToolApproval(
  request: ToolApprovalResponseRequest
): ToolApprovalResponseResult {
  const pendingRequest = pendingApprovalRequests.get(request.requestId);

  if (!pendingRequest) {
    return {
      errorMessage: "That approval request is no longer pending.",
      ok: false
    };
  }

  if (request.rememberChoice && (!pendingRequest.canRemember || pendingRequest.risk !== "safe")) {
    return {
      errorMessage: "Pi cannot remember that approval choice for this request.",
      ok: false
    };
  }

  const auditEntry: ToolApprovalAuditEntry = {
    actionLabel: pendingRequest.actionLabel,
    category: pendingRequest.category,
    decision: request.rememberChoice ? "remembered" : request.decision,
    id: `approval-response-${request.requestId}-${Date.now()}`,
    requester: pendingRequest.requester ?? "Jon",
    risk: pendingRequest.risk,
    timestampLabel: "now"
  };

  pendingApprovalRequests.delete(request.requestId);
  return {
    auditEntry,
    ok: true
  };
}
