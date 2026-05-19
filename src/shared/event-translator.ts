import type { AppEvent, RawPiEvent } from "./events";
import type {
  ToolApprovalAuditEntry,
  ToolApprovalRequest,
  ToolPermissionCategory,
  ToolPermissionRisk
} from "./tool-approvals";

type AppEventDraft = AppEvent extends infer Event
  ? Event extends AppEvent
    ? Omit<Event, "id" | "timestamp"> & { timestamp?: string }
    : never
  : never;

type EventIdFactory = (kind: AppEvent["kind"]) => string;

interface TranslateRawPiEventOptions {
  assistantMessageId?: string;
  includeUserMessages?: boolean;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : null;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function getApprovalCategory(value: unknown): ToolPermissionCategory | null {
  switch (value) {
    case "destructive":
    case "filesystem":
    case "git":
    case "github":
    case "network":
    case "shell":
      return value;
    default:
      return null;
  }
}

function getApprovalRisk(value: unknown): ToolPermissionRisk | null {
  switch (value) {
    case "destructive":
    case "elevated":
    case "safe":
      return value;
    default:
      return null;
  }
}

function getApprovalRequest(value: unknown): ToolApprovalRequest | null {
  const request = asRecord(asRecord(value)?.request ?? value);
  const id = getString(request?.id);
  const title = getString(request?.title);
  const summary = getString(request?.summary);
  const actionLabel = getString(request?.actionLabel);
  const category = getApprovalCategory(request?.category);
  const risk = getApprovalRisk(request?.risk);

  if (!id || !title || !summary || !actionLabel || !category || !risk) {
    return null;
  }

  return {
    actionLabel,
    canRemember: getBoolean(request?.canRemember) ?? undefined,
    category,
    commandPreview: getString(request?.commandPreview) ?? undefined,
    expiresAtLabel: getString(request?.expiresAtLabel) ?? undefined,
    id,
    projectLabel: getString(request?.projectLabel) ?? undefined,
    requester: getString(request?.requester) ?? undefined,
    risk,
    status:
      request?.status === "expired" || request?.status === "superseded"
        ? request.status
        : "pending",
    summary,
    targetLabel: getString(request?.targetLabel) ?? undefined,
    title
  };
}

function getApprovalAuditEntry(value: unknown): ToolApprovalAuditEntry | null {
  const entry = asRecord(asRecord(value)?.auditEntry ?? value);
  const id = getString(entry?.id);
  const actionLabel = getString(entry?.actionLabel);
  const category = getApprovalCategory(entry?.category);
  const risk = getApprovalRisk(entry?.risk);
  const timestampLabel = getString(entry?.timestampLabel);

  if (!id || !actionLabel || !category || !risk || !timestampLabel) {
    return null;
  }

  switch (entry?.decision) {
    case "approved":
    case "automatic":
    case "denied":
    case "expired":
    case "remembered":
      return {
        actionLabel,
        category,
        decision: entry.decision,
        id,
        requester: getString(entry.requester) ?? undefined,
        risk,
        timestampLabel
      };
    default:
      return null;
  }
}

function getMessage(payload: unknown): UnknownRecord | null {
  return asRecord(asRecord(payload)?.message);
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => asRecord(part))
    .filter((part): part is UnknownRecord => Boolean(part))
    .filter((part) => part.type === "text")
    .map((part) => getString(part.text) ?? "")
    .join("");
}

function createEvent(rawEvent: RawPiEvent, createId: EventIdFactory, draft: AppEventDraft): AppEvent {
  return {
    ...draft,
    id: createId(draft.kind),
    timestamp: draft.timestamp ?? rawEvent.timestamp
  } as AppEvent;
}

export function translateRawPiEvent(
  rawEvent: RawPiEvent,
  createId: EventIdFactory,
  options: TranslateRawPiEventOptions = {}
): AppEvent[] {
  const payload = asRecord(rawEvent.payload);

  switch (rawEvent.type) {
    case "approval_request":
    case "tool.approval.request":
    case "tool_approval_request": {
      const request = getApprovalRequest(payload);

      if (!request) {
        return [];
      }

      return [
        createEvent(rawEvent, createId, {
          kind: "tool.approval.request",
          rawEventId: rawEvent.id,
          request
        })
      ];
    }
    case "approval_decision":
    case "tool.approval.decision":
    case "tool_approval_decision": {
      const auditEntry = getApprovalAuditEntry(payload);

      if (!auditEntry) {
        return [];
      }

      return [
        createEvent(rawEvent, createId, {
          auditEntry,
          kind: "tool.approval.decision",
          rawEventId: rawEvent.id
        })
      ];
    }
    case "agent_start":
    case "turn_start":
      return [
        createEvent(rawEvent, createId, {
          kind: "session.status",
          rawEventId: rawEvent.id,
          status: "running"
        })
      ];
    case "agent_end":
    case "turn_end":
      return [
        createEvent(rawEvent, createId, {
          kind: "session.status",
          rawEventId: rawEvent.id,
          status: "ready"
        })
      ];
    case "message_start": {
      const message = getMessage(rawEvent.payload);

      if (message?.role !== "user" || options.includeUserMessages === false) {
        return [];
      }

      return [
        createEvent(rawEvent, createId, {
          kind: "message.user",
          messageId: `${rawEvent.id}-user`,
          content: extractTextContent(message.content)
        })
      ];
    }
    case "message_update": {
      const assistantMessageEvent = asRecord(payload?.assistantMessageEvent);

      if (assistantMessageEvent?.type !== "text_delta") {
        return [];
      }

      return [
        createEvent(rawEvent, createId, {
          kind: "message.assistant.delta",
          rawEventId: rawEvent.id,
          messageId: options.assistantMessageId ?? `${rawEvent.id}-assistant`,
          delta: getString(assistantMessageEvent.delta) ?? ""
        })
      ];
    }
    case "message_end": {
      const message = getMessage(rawEvent.payload);

      if (message?.role !== "assistant") {
        return [];
      }

      return [
        createEvent(rawEvent, createId, {
          kind: "message.assistant.complete",
          rawEventId: rawEvent.id,
          messageId: options.assistantMessageId ?? `${rawEvent.id}-assistant`
        })
      ];
    }
    case "tool_execution_start":
      return [
        createEvent(rawEvent, createId, {
          kind: "tool.execution.start",
          rawEventId: rawEvent.id,
          toolCallId: getString(payload?.toolCallId) ?? rawEvent.id,
          toolName: getString(payload?.toolName) ?? "unknown",
          args: payload?.args
        })
      ];
    case "tool_execution_update":
      return [
        createEvent(rawEvent, createId, {
          kind: "tool.execution.update",
          rawEventId: rawEvent.id,
          toolCallId: getString(payload?.toolCallId) ?? rawEvent.id,
          toolName: getString(payload?.toolName) ?? "unknown",
          partialResult: payload?.partialResult
        })
      ];
    case "tool_execution_end":
      return [
        createEvent(rawEvent, createId, {
          kind: "tool.execution.end",
          rawEventId: rawEvent.id,
          toolCallId: getString(payload?.toolCallId) ?? rawEvent.id,
          toolName: getString(payload?.toolName) ?? "unknown",
          result: payload?.result,
          isError: getBoolean(payload?.isError) ?? false
        })
      ];
    default:
      return [];
  }
}
