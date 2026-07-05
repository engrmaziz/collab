export type DocumentType = "document" | "folder";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export interface Doc {
  id: string;
  title: string;
  content: string;
  parent_id: string | null;
  owner_id: string;
  type: DocumentType;
  created_at: string;
  updated_at: string;
}

export interface DocumentMember {
  id: string;
  document_id: string;
  user_id: string;
  added_at: string;
  profile?: Profile;
}

export interface DocumentSnapshot {
  id: string;
  document_id: string;
  content: string;
  label: string | null;
  created_by: string | null;
  created_at: string;
}

export interface RemoteCursor {
  userId: string;
  email: string;
  color: string;
  position: number; // character index in the content
  updatedAt: number;
}

export const CURSOR_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet (cursor only)
  "#ec4899", // pink (cursor only)
  "#14b8a6", // teal
] as const;

export type CursorColor = (typeof CURSOR_COLORS)[number];
