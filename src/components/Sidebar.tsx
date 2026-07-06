import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { LogOut, LayoutGrid, FolderPlus, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentTree } from "./DocumentTree";
import { initialsFromEmail } from "@/lib/utils";

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { docs, createDocument, deleteDocument } = useDocuments();
  const navigate = useNavigate();

  // Theme state
  const [isDark, setIsDark] = useState(true);

  // Sync state with DOM on mount
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

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
    <aside className="w-[240px] shrink-0 h-full bg-base border-r border-border flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-border">
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

      <div className="border-t border-border p-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-medium">
          {user?.email ? initialsFromEmail(user.email) : "?"}
        </div>
        <span className="text-xs text-muted truncate flex-1">{user?.email}</span>
        
        {/* Theme Toggle Button */}
        <button 
          title="Toggle Theme" 
          onClick={toggleTheme} 
          className="p-1.5 rounded hover:bg-surface text-muted hover:text-text transition-colors"
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Logout Button */}
        <button 
          title="Sign out" 
          onClick={signOut} 
          className="p-1.5 rounded hover:bg-surface text-muted hover:text-text transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}