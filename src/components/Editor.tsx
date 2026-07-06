import React, { useCallback, useEffect, useRef, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Share2, History, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDocument } from "@/hooks/useDocument";
import { useRealtimeCollab } from "@/hooks/useRealtimeCollab";
import { usePresenceCursors } from "@/hooks/usePresenceCursors";
import { useSnapshots } from "@/hooks/useSnapshots";
import { useDebouncedCallback, useDebouncedEffect } from "@/hooks/useDebounce";
import { supabase } from "@/lib/supabaseClient";
import { CursorOverlay } from "./CursorOverlay";
import { ShareModal } from "./ShareModal";
import { SnapshotList } from "./SnapshotList";
import { ExportMenu } from "./ExportMenu";

interface Props {
  documentId: string;
}

const BROADCAST_DEBOUNCE_MS = 400;
const AUTOSAVE_DEBOUNCE_MS = 2000;

export function Editor({ documentId }: Props) {
  const { user, cursorColor } = useAuth();
  const { doc, loading, saving, saveContent, renameDocument } = useDocument(documentId);
  const { snapshots, restoreSnapshot } = useSnapshots(documentId);

  const [content, setContent] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isRemoteUpdate = useRef(false);
  
  // Track theme for MDEditor
  const [colorMode, setColorMode] = useState<"light" | "dark">("dark");

  const handleRemoteContent = useCallback((remoteContent: string) => {
    isRemoteUpdate.current = true;
    setContent(remoteContent);
  }, []);

  const { broadcastContent, connected, channelRef } = useRealtimeCollab(
    documentId,
    user?.id,
    handleRemoteContent
  );

  const { cursors, updateCursorPosition } = usePresenceCursors(
    channelRef,
    connected,
    { userId: user?.id ?? "", email: user?.email ?? "unknown", color: cursorColor }
  );

  // Initialize local content once the document loads
  useEffect(() => {
    if (doc) {
      setContent(doc.content ?? "");
      setTitleDraft(doc.title ?? "");
    }
  }, [doc?.id]);

  // Watch for theme changes so the markdown editor matches the app
  useEffect(() => {
    const checkTheme = () => {
      setColorMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const debouncedBroadcast = useDebouncedCallback((value: string) => {
    broadcastContent(value);
  }, BROADCAST_DEBOUNCE_MS);

  // Autosave + snapshot after 2s of inactivity
  useDebouncedEffect(content, AUTOSAVE_DEBOUNCE_MS, (value) => {
    saveContent(value);
  });

  const handleChange = (value?: string) => {
    const next = value ?? "";
    setContent(next);
    if (!isRemoteUpdate.current) {
      debouncedBroadcast(next);
    }
    isRemoteUpdate.current = false;
  };

  const handleTitleBlur = () => {
    if (titleDraft.trim() && titleDraft !== doc?.title) {
      renameDocument(titleDraft.trim());
    }
  };

  const handleImageUpload = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${documentId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("document-images").upload(path, file);
      if (error) return null;
      const { data } = supabase.storage.from("document-images").getPublicUrl(path);
      return data.publicUrl;
    },
    [documentId]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((i) => i.type.startsWith("image/"));
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (!file) return;
      e.preventDefault();
      const url = await handleImageUpload(file);
      if (url) {
        setContent((prev) => `${prev}\n![pasted image](${url})\n`);
      }
    },
    [handleImageUpload]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
      if (!file) return;
      e.preventDefault();
      const url = await handleImageUpload(file);
      if (url) {
        setContent((prev) => `${prev}\n![dropped image](${url})\n`);
      }
    },
    [handleImageUpload]
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-sm">
        Loading document…
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-sm">
        Document not found or access denied.
      </div>
    );
  }

  const isOwner = doc.owner_id === user?.id;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      <header className="h-14 glass-header flex items-center justify-between px-4 no-print">
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleTitleBlur}
          className="bg-transparent text-lg font-semibold outline-none focus:underline decoration-border underline-offset-4"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted flex items-center gap-1 mr-2">
            {saving ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Saving…
              </>
            ) : (
              "Saved"
            )}
          </span>
          <ExportMenu title={doc.title} content={content} />
          <button className="btn gap-1.5" onClick={() => setHistoryOpen(true)}>
            <History size={14} /> History
          </button>
          <button className="btn-primary gap-1.5" onClick={() => setShareOpen(true)}>
            <Share2 size={14} /> Share
          </button>
        </div>
      </header>

      <CursorOverlay cursors={cursors} />

      <div
        className="flex-1 min-h-0 overflow-auto"
        data-color-mode={colorMode}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onKeyUp={(e) => {
          const target = e.target as HTMLTextAreaElement;
          if (typeof target.selectionStart === "number") {
            updateCursorPosition(target.selectionStart);
          }
        }}
        onClick={(e) => {
          const target = e.target as HTMLTextAreaElement;
          if (typeof target.selectionStart === "number") {
            updateCursorPosition(target.selectionStart);
          }
        }}
      >
        <MDEditor
          value={content}
          onChange={handleChange}
          height="100%"
          preview="live"
          visibleDragbar={false}
        />
      </div>

      {shareOpen && (
        <ShareModal documentId={documentId} isOwner={isOwner} onClose={() => setShareOpen(false)} />
      )}
      {historyOpen && (
        <SnapshotList
          snapshots={snapshots}
          onRestore={async (s) => {
            await restoreSnapshot(s);
            setContent(s.content);
            setHistoryOpen(false);
          }}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}