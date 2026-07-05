import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DocumentSnapshot } from "@/types";

export function useSnapshots(documentId: string | undefined) {
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSnapshots = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("document_snapshots")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) setSnapshots(data as DocumentSnapshot[]);
    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  useEffect(() => {
    if (!documentId) return;
    const channel = supabase
      .channel(`snapshots-${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "document_snapshots",
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          setSnapshots((prev) => [payload.new as DocumentSnapshot, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId]);

  const restoreSnapshot = useCallback(
    async (snapshot: DocumentSnapshot) => {
      if (!documentId) return { error: "No document" };
      const { error } = await supabase
        .from("documents")
        .update({ content: snapshot.content })
        .eq("id", documentId);
      return { error: error ? error.message : null };
    },
    [documentId]
  );

  return { snapshots, loading, refetch: fetchSnapshots, restoreSnapshot };
}
