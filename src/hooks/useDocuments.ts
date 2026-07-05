import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Doc, DocumentType } from "@/types";
import { useAuth } from "@/context/AuthContext";

/**
 * Loads all documents/folders the user owns or is a member of,
 * and keeps the list in sync via Supabase Realtime postgres changes.
 */
export function useDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setDocs(data as Doc[]);
      setError(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useEffect(() => {
    if (!user) return;

    // Append Date.now() to force a fresh channel and prevent caching clashes
    const channelName = `documents-changes-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents" },
        (payload) => {
          setDocs((prev) => {
            if (payload.eventType === "INSERT") {
              const newDoc = payload.new as Doc;
              if (prev.some((d) => d.id === newDoc.id)) return prev;
              return [...prev, newDoc];
            }
            if (payload.eventType === "UPDATE") {
              const updated = payload.new as Doc;
              return prev.map((d) => (d.id === updated.id ? updated : d));
            }
            if (payload.eventType === "DELETE") {
              const removed = payload.old as Doc;
              return prev.filter((d) => d.id !== removed.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createDocument = useCallback(
    async (title: string, type: DocumentType, parentId: string | null) => {
      if (!user) return { error: "Not authenticated" };
      const { data, error } = await supabase
        .from("documents")
        .insert({ title, type, parent_id: parentId, owner_id: user.id, content: "" })
        .select()
        .single();
      if (error) return { error: error.message };
      return { error: null, doc: data as Doc };
    },
    [user]
  );

  const renameDocument = useCallback(async (id: string, title: string) => {
    const { error } = await supabase.from("documents").update({ title }).eq("id", id);
    return { error: error ? error.message : null };
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    return { error: error ? error.message : null };
  }, []);

  return { docs, loading, error, createDocument, renameDocument, deleteDocument, refetch: fetchDocs };
}