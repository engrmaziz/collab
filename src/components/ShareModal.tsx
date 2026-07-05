import { useEffect, useState, useCallback } from "react";
import { X, UserMinus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { DocumentMember, Profile } from "@/types";

interface Props {
  documentId: string;
  isOwner: boolean;
  onClose: () => void;
}

export function ShareModal({ documentId, isOwner, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<(DocumentMember & { profile: Profile })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from("document_members")
      .select("*, profile:profiles(*)")
      .eq("document_id", documentId);
    if (!error && data) setMembers(data as unknown as (DocumentMember & { profile: Profile })[]);
  }, [documentId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAdd = async () => {
    setError(null);
    setBusy(true);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email.trim())
      .single();

    if (profileError || !profile) {
      setError("No user found with that email.");
      setBusy(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("document_members")
      .insert({ document_id: documentId, user_id: profile.id });

    if (insertError) {
      setError(insertError.message);
    } else {
      setEmail("");
      await loadMembers();
    }
    setBusy(false);
  };

  const handleRemove = async (memberId: string) => {
    await supabase.from("document_members").delete().eq("id", memberId);
    await loadMembers();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Share document</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-muted hover:text-text">
            <X size={16} />
          </button>
        </div>

        {isOwner && (
          <div className="flex gap-2 mb-4">
            <input
              className="input"
              placeholder="collaborator@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button className="btn-primary shrink-0" onClick={handleAdd} disabled={busy || !email}>
              Add
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {members.length === 0 && (
            <p className="text-xs text-muted">No collaborators yet.</p>
          )}
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5"
            >
              <span className="text-sm text-text/90">{m.profile?.email}</span>
              {isOwner && (
                <button
                  onClick={() => handleRemove(m.id)}
                  className="p-1 rounded hover:bg-white/10 text-muted hover:text-red-400"
                  title="Remove"
                >
                  <UserMinus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
