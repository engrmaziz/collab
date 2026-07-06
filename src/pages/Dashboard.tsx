import { useNavigate } from "react-router-dom";
import { FileText, Folder, Plus } from "lucide-react";
import { Layout } from "@/components/Layout";
import { useDocuments } from "@/hooks/useDocuments";
import { formatDate } from "@/lib/utils";

export function Dashboard() {
  const { docs, loading, createDocument } = useDocuments();
  const navigate = useNavigate();

  const rootDocs = docs.filter((d) => d.parent_id === null);

  const handleNew = async () => {
    const { doc, error } = await createDocument("Untitled", "document", null);
    if (!error && doc) navigate(`/doc/${doc.id}`);
  };

  return (
    <Layout>
      <div className="h-14 glass-header flex items-center justify-between px-6">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <button className="btn-primary gap-1.5" onClick={handleNew}>
          <Plus size={14} /> New document
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : rootDocs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-sm mb-4">No documents yet.</p>
            <button className="btn-primary" onClick={handleNew}>
              Create your first document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {rootDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => doc.type === "document" && navigate(`/doc/${doc.id}`)}
                className="card p-4 text-left hover:border-accent transition-colors duration-150"
              >
                <div className="flex items-center gap-2 mb-3 text-accent">
                  {doc.type === "folder" ? <Folder size={18} /> : <FileText size={18} />}
                </div>
                <p className="text-sm font-medium truncate mb-1">{doc.title}</p>
                <p className="text-xs text-muted">{formatDate(doc.updated_at)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}