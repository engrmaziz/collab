import { RemoteCursor } from "@/types";

interface Props {
  cursors: Record<string, RemoteCursor>;
}

/**
 * Renders a small legend of active collaborators with colored dots.
 * Precise in-text caret rendering inside a textarea is approximated:
 * we surface presence as avatars/labels rather than pixel-perfect carets,
 * since @uiw/react-md-editor wraps a plain textarea without per-character
 * DOM nodes to anchor an overlay to.
 */
export function CursorOverlay({ cursors }: Props) {
  const list = Object.values(cursors);
  if (list.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 bg-card/50">
      <span className="text-xs text-muted">Live:</span>
      {list.map((c) => (
        <div
          key={c.userId}
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
          style={{ backgroundColor: `${c.color}22`, color: c.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
          {c.email.split("@")[0]}
        </div>
      ))}
    </div>
  );
}
