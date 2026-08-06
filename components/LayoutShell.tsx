import type { ReactNode } from "react";
import { AuthLoadingShell } from "@/lib/auth";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface LayoutShellProps {
  children: ReactNode;
  withSidebar?: boolean;
}

export function LayoutShell({ children, withSidebar = false }: LayoutShellProps) {
  const content = (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.06),_transparent_60%),_radial-gradient(rgba(0,0,0,0.08)_1px,transparent_1px),_linear-gradient(#f7f3ed,#f4efe8)] [background-size:auto,18px_18px,auto] [background-position:0_0,0_0,0_0]">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        {withSidebar && <Sidebar />}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );

  if (withSidebar) {
    return <AuthLoadingShell>{content}</AuthLoadingShell>;
  }

  return content;
}
