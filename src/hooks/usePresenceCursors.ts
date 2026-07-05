import { useEffect, useRef, useState, MutableRefObject } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { RemoteCursor } from "@/types";

interface PresenceMeta {
  userId: string;
  email: string;
  color: string;
  position: number;
  updatedAt: number;
}

/**
 * Tracks remote cursor positions using Supabase Realtime Presence.
 * Uses a dedicated presence channel to avoid lifecycle conflicts 
 * with the broadcast channel.
 */
export function usePresenceCursors(
  channelRef: MutableRefObject<RealtimeChannel | null>,
  connected: boolean,
  self: { userId: string; email: string; color: string }
) {
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({});
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Wait for the primary channel to be connected to get its base topic
    if (!channelRef.current || !connected) return;

    // Extract base topic (e.g., "doc-123") safely
    const baseTopic = channelRef.current.topic.replace(/^realtime:/, "");
    const presenceTopic = `${baseTopic}-presence`;

    // Create a dedicated channel for presence. This entirely bypasses the 
    // "cannot add callbacks after subscribe()" error caused by sharing a channel.
    const presenceChannel = supabase.channel(presenceTopic);

    const syncState = () => {
      const state = presenceChannel.presenceState<PresenceMeta>();
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

    presenceChannel.on("presence", { event: "sync" }, syncState);
    presenceChannel.on("presence", { event: "join" }, syncState);
    presenceChannel.on("presence", { event: "leave" }, syncState);

    presenceChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await presenceChannel.track({
          userId: self.userId,
          email: self.email,
          color: self.color,
          position: 0,
          updatedAt: Date.now(),
        } as PresenceMeta);
      }
    });

    presenceChannelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(presenceChannel);
      presenceChannelRef.current = null;
    };
  }, [channelRef, connected, self.userId, self.email, self.color]);

  const updateCursorPosition = (position: number) => {
    const channel = presenceChannelRef.current;
    if (!channel) return;
    
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