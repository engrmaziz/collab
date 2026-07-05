import React, { useState } from "react";
import { X, RotateCcw, Eye } from "lucide-react";
import { DocumentSnapshot } from "@/types";
import { formatDate } from "@/lib/utils";

interface Props {
  snapshots: DocumentSnapshot[];
  onRestore: (snapshot: DocumentSnapshot) => void;
  onClose: () => void;
}

export function SnapshotList({ snapshots, onRestore, onClose }: Props) {
  const [preview, setPreview] = useState<DocumentSnapshot | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card w-full max-w-2xl p-5 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Version history</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5 text-muted hover:text-text">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 gap-4">
          <div className="w-56 shrink-0 overflow-y-auto space-y-1">
            {snapshots.length === 0 && <p className="text-xs text-muted">No snapshots yet.</p>}
            {snapshots.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer text-xs"
                onClick={() => setPreview(s)}
              >
                <span className="text-muted">{formatDate(s.created_at)}</span>
                <div className="flex gap-1">
                  <button title="Preview" onClick={(e) => { e.stopPropagation(); setPreview(s); }} className="p-1 rounded hover:bg-white/10">
                    <Eye size={12} />
                  </button>
                  <button title="Restore" onClick={(e) => { e.stopPropagation(); onRestore(s); }} className="p-1 rounded hover:bg-white/10">
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto bg-white/5 rounded-md p-3 text-xs whitespace-pre-wrap font-mono text-text/80">
            {preview ? preview.content || "(empty)" : "Select a snapshot to preview its content."}
          </div>
        </div>
      </div>
    </div>
  );
}
