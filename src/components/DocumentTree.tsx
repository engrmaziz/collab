import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronRight, ChevronDown, FileText, Folder, Plus, Trash2 } from "lucide-react";
import { Doc } from "@/types";
import { cn } from "@/lib/utils";

interface TreeNode extends Doc {
  children: TreeNode[];
}

function buildTree(docs: Doc[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  docs.forEach((d) => map.set(d.id, { ...d, children: [] }));
  const roots: TreeNode[] = [];

  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

interface Props {
  docs: Doc[];
  onCreate: (type: "document" | "folder", parentId: string | null) => void;
  onDelete: (id: string) => void;
}

export function DocumentTree({ docs, onCreate, onDelete }: Props) {
  const tree = useMemo(() => buildTree(docs), [docs]);

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs uppercase tracking-wide text-muted">Documents</span>
        <div className="flex gap-1">
          <button
            title="New document"
            onClick={() => onCreate("document", null)}
            className="p-1 rounded hover:bg-white/5 text-muted hover:text-text transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      {tree.map((node) => (
        <TreeItem key={node.id} node={node} depth={0} onCreate={onCreate} onDelete={onDelete} />
      ))}
    </div>
  );
}

function TreeItem({
  node,
  depth,
  onCreate,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  onCreate: (type: "document" | "folder", parentId: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  const { id: activeId } = useParams();
  const isFolder = node.type === "folder";
  const isActive = activeId === node.id;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer text-sm transition-colors duration-150",
          isActive ? "bg-accent/15 text-text" : "text-muted hover:bg-white/5 hover:text-text"
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => {
          if (isFolder) setExpanded((e) => !e);
          else navigate(`/doc/${node.id}`);
        }}
      >
        {isFolder ? (
          expanded ? (
            <ChevronDown size={14} className="shrink-0" />
          ) : (
            <ChevronRight size={14} className="shrink-0" />
          )
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        {isFolder ? <Folder size={14} className="shrink-0" /> : <FileText size={14} className="shrink-0" />}
        <span className="truncate flex-1">{node.title}</span>
        <div className="hidden group-hover:flex items-center gap-1">
          {isFolder && (
            <button
              title="New document inside"
              onClick={(e) => {
                e.stopPropagation();
                onCreate("document", node.id);
              }}
              className="p-0.5 rounded hover:bg-white/10"
            >
              <Plus size={12} />
            </button>
          )}
          <button
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="p-0.5 rounded hover:bg-white/10"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {isFolder && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} onCreate={onCreate} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
