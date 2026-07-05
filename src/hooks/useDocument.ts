import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Doc } from "@/types";

export function useDocument(documentId: string | undefined) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    setLoading(true);

    supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setDoc(data as Doc);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const saveContent = useCallback(
    async (content: string) => {
      if (!documentId) return;
      setSaving(true);
      const { error } = await supabase
        .from("documents")
        .update({ content })
        .eq("id", documentId);

      if (!error) {
        // create a version snapshot on every autosave
        await supabase.from("document_snapshots").insert({
          document_id: documentId,
          content,
        });
      } else {
        setError(error.message);
      }
      setSaving(false);
    },
    [documentId]
  );

  const renameDocument = useCallback(
    async (title: string) => {
      if (!documentId) return;
      const { error } = await supabase
        .from("documents")
        .update({ title })
        .eq("id", documentId);
      if (!error) setDoc((prev) => (prev ? { ...prev, title } : prev));
    },
    [documentId]
  );

  return { doc, setDoc, loading, error, saving, saveContent, renameDocument };
}
