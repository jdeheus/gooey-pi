import type { ChatItem, RuntimeTranscriptEvent } from "./chat";
import { normalizeRuntimeTranscriptEvents } from "./chat";

export const RUNTIME_TRANSCRIPT_SNAPSHOT_VERSION = 1;

export type RuntimeTranscriptSnapshotSource = "normalized-runtime-events";

export interface RuntimeTranscriptSnapshotReplayMetadata {
  canReplay: true;
  itemCount: number;
  lastSequence: number | null;
  source: RuntimeTranscriptSnapshotSource;
}

export interface RuntimeTranscriptSnapshot {
  createdAt: string;
  events: RuntimeTranscriptEvent[];
  eventCount: number;
  id: string;
  projectPath: string | null;
  replay: RuntimeTranscriptSnapshotReplayMetadata;
  schemaVersion: typeof RUNTIME_TRANSCRIPT_SNAPSHOT_VERSION;
  sessionId: string | null;
  updatedAt: string;
}

export interface RuntimeTranscriptReplay {
  events: RuntimeTranscriptEvent[];
  items: ChatItem[];
  replayedAt: string;
  snapshotId: string;
}

export interface CreateRuntimeTranscriptSnapshotInput {
  createdAt?: string;
  events: RuntimeTranscriptEvent[];
  id: string;
  projectPath: string | null;
  sessionId: string | null;
  updatedAt?: string;
}

export function createRuntimeTranscriptSnapshot(
  input: CreateRuntimeTranscriptSnapshotInput
): RuntimeTranscriptSnapshot {
  const events = orderRuntimeTranscriptEvents(input.events);
  const updatedAt = input.updatedAt ?? new Date().toISOString();
  const lastSequence = events.reduce<number | null>((latest, event, index) => {
    const sequence = event.sequence ?? index + 1;
    return latest === null ? sequence : Math.max(latest, sequence);
  }, null);

  return {
    createdAt: input.createdAt ?? updatedAt,
    events,
    eventCount: events.length,
    id: input.id,
    projectPath: input.projectPath,
    replay: {
      canReplay: true,
      itemCount: events.length,
      lastSequence,
      source: "normalized-runtime-events"
    },
    schemaVersion: RUNTIME_TRANSCRIPT_SNAPSHOT_VERSION,
    sessionId: input.sessionId,
    updatedAt
  };
}

export function replayRuntimeTranscriptSnapshot(
  snapshot: RuntimeTranscriptSnapshot
): RuntimeTranscriptReplay {
  const events = orderRuntimeTranscriptEvents(snapshot.events);

  return {
    events,
    items: normalizeRuntimeTranscriptEvents(events),
    replayedAt: new Date().toISOString(),
    snapshotId: snapshot.id
  };
}

export function orderRuntimeTranscriptEvents(
  events: RuntimeTranscriptEvent[]
): RuntimeTranscriptEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort((left, right) => {
      const leftSequence = left.event.sequence ?? left.index;
      const rightSequence = right.event.sequence ?? right.index;

      if (leftSequence === rightSequence) {
        return left.index - right.index;
      }

      return leftSequence - rightSequence;
    })
    .map(({ event }) => ({ ...event }));
}
