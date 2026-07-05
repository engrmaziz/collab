import { useEffect, useRef, useCallback, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

interface ContentUpdatePayload {
  content: string;
  senderId: string;
}

/**
 * Sets up a Supabase Realtime Broadcast channel `doc-<documentId>` for
 * "last writer wins" full-content sync between collaborators.
 */
export function useRealtimeCollab(
  documentId: string | undefined,
  userId: string | undefined,
  onRemoteContent: (content: string) => void
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!documentId || !userId) return;

    const channel = supabase.channel(`doc-${documentId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "content-update" }, (payload) => {
        const data = payload.payload as ContentUpdatePayload;
        if (data.senderId === userId) return;
        onRemoteContent(data.content);
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, userId]);

  const broadcastContent = useCallback(
    (content: string) => {
      if (!channelRef.current || !userId) return;
      channelRef.current.send({
        type: "broadcast",
        event: "content-update",
        payload: { content, senderId: userId } as ContentUpdatePayload,
      });
    },
    [userId]
  );

  return { broadcastContent, connected, channelRef };
}
