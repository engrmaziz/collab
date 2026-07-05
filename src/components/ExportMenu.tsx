import React, { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, Printer } from "lucide-react";
import { marked } from "marked";
import { downloadTextFile } from "@/lib/utils";

interface Props {
  title: string;
  content: string;
}

export function ExportMenu({ title, content }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const exportMd = () => {
    downloadTextFile(`${title || "document"}.md`, content, "text/markdown");
    setOpen(false);
  };

  const exportHtml = async () => {
    const html = await marked.parse(content);
    const full = `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`;
    downloadTextFile(`${title || "document"}.html`, full, "text/html");
    setOpen(false);
  };

  const printDoc = () => {
    window.print();
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button className="btn gap-1.5" onClick={() => setOpen((o) => !o)}>
        <Download size={14} /> Export <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 card p-1 z-40">
          <button onClick={exportMd} className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-white/5">
            Download .md
          </button>
          <button onClick={exportHtml} className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-white/5">
            Download .html
          </button>
          <button onClick={printDoc} className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-white/5 flex items-center gap-2">
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      )}
    </div>
  );
}
