import { CURSOR_COLORS, CursorColor } from "@/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function randomCursorColor(): CursorColor {
  const idx = Math.floor(Math.random() * CURSOR_COLORS.length);
  return CURSOR_COLORS[idx];
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function downloadTextFile(filename: string, content: string, mime = "text/markdown") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function initialsFromEmail(email: string): string {
  const name = email.split("@")[0];
  return name.slice(0, 2).toUpperCase();
}
