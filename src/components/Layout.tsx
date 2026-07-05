import React from "react";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex bg-base overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden flex flex-col">{children}</main>
    </div>
  );
}
