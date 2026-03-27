import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface LayoutShellProps {
  children: ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(0,0,0,0.06),_transparent_60%),_linear-gradient(#f7f3ed,#f4efe8)]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

