import { useNavigate } from "react-router-dom";
import { LogOut, LayoutGrid, FolderPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentTree } from "./DocumentTree";
import { initialsFromEmail } from "@/lib/utils";

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { docs, createDocument, deleteDocument } = useDocuments();
  const navigate = useNavigate();

  const handleCreate = async (type: "document" | "folder", parentId: string | null) => {
    const title = type === "folder" ? "New folder" : "Untitled";
    const { doc, error } = await createDocument(title, type, parentId);
    if (!error && doc && type === "document") {
      navigate(`/doc/${doc.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this item? This cannot be undone.")) {
      await deleteDocument(id);
    }
  };

  return (
    <aside className="w-[240px] shrink-0 h-full bg-base border-r border-white/10 flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-white/10">
        <span className="font-semibold text-text tracking-tight">CollabMD</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => navigate("/")}
          className="btn flex-1 justify-start gap-2"
        >
          <LayoutGrid size={14} /> Dashboard
        </button>
        <button
          title="New folder"
          onClick={() => handleCreate("folder", null)}
          className="btn px-2"
        >
          <FolderPlus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-2">
        <DocumentTree docs={docs} onCreate={handleCreate} onDelete={handleDelete} />
      </div>

      <div className="border-t border-white/10 p-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-medium">
          {user?.email ? initialsFromEmail(user.email) : "?"}
        </div>
        <span className="text-xs text-muted truncate flex-1">{user?.email}</span>
        <button title="Sign out" onClick={signOut} className="p-1 rounded hover:bg-white/5 text-muted hover:text-text">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
