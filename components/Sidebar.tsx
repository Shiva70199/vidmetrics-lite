"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/datasets", label: "Datasets" },
  { href: "/analytics", label: "Analytics" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav className="sticky top-24 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "block rounded-xl px-4 py-2.5 text-sm font-medium transition",
              pathname === item.href
                ? "bg-black text-white"
                : "text-neutral-600 hover:bg-white/80 hover:text-black"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {user && (
        <div className="mt-8 rounded-xl border border-neutral-200 bg-white/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Signed in
          </p>
          <p className="mt-2 truncate text-sm font-medium text-neutral-900">{user.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 text-xs font-semibold text-neutral-600 underline-offset-2 hover:text-black hover:underline"
          >
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
