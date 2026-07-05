import { useEffect, useRef, useState, MutableRefObject } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { RemoteCursor } from "@/types";

interface PresenceMeta {
  userId: string;
  email: string;
  color: string;
  position: number;
  updatedAt: number;
}

/**
 * Tracks remote cursor positions using Supabase Realtime Presence,
 * sharing the same channel instance created by useRealtimeCollab
 * (channel name `doc-<documentId>`).
 */
export function usePresenceCursors(
  channelRef: MutableRefObject<RealtimeChannel | null>,
  connected: boolean,
  self: { userId: string; email: string; color: string }
) {
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({});
  const trackedRef = useRef(false);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !connected) return;

    const syncState = () => {
      const state = channel.presenceState<PresenceMeta>();
      const next: Record<string, RemoteCursor> = {};
      Object.values(state).forEach((entries) => {
        entries.forEach((entry) => {
          if (entry.userId === self.userId) return;
          next[entry.userId] = {
            userId: entry.userId,
            email: entry.email,
            color: entry.color,
            position: entry.position,
            updatedAt: entry.updatedAt,
          };
        });
      });
      setCursors(next);
    };

    channel.on("presence", { event: "sync" }, syncState);
    channel.on("presence", { event: "join" }, syncState);
    channel.on("presence", { event: "leave" }, syncState);

    if (!trackedRef.current) {
      trackedRef.current = true;
      channel.track({
        userId: self.userId,
        email: self.email,
        color: self.color,
        position: 0,
        updatedAt: Date.now(),
      } as PresenceMeta);
    }

    return () => {
      trackedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelRef, connected, self.userId]);

  const updateCursorPosition = (position: number) => {
    const channel = channelRef.current;
    if (!channel || !connected) return;
    channel.track({
      userId: self.userId,
      email: self.email,
      color: self.color,
      position,
      updatedAt: Date.now(),
    } as PresenceMeta);
  };

  return { cursors, updateCursorPosition };
}
