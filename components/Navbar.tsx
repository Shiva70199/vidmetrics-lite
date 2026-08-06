"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/lib/auth";

const publicPaths = ["/login", "/register", "/"];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, token } = useAuth();
  const isPublic = publicPaths.includes(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-[#f7f3ed]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href={token ? "/dashboard" : "/"} className="flex items-center gap-3 transition hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2563eb] bg-[#2563eb] text-[11px] font-semibold text-white">
            DB
          </div>
          <span className="text-sm font-semibold tracking-tight text-black sm:text-base">
            Data<span className="text-neutral-500">Board</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {token && !isPublic && (
            <nav className="flex items-center gap-1 lg:hidden">
              {[
                { href: "/dashboard", label: "Home" },
                { href: "/datasets", label: "Data" },
                { href: "/analytics", label: "Charts" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    pathname === item.href
                      ? "bg-black text-white"
                      : "text-neutral-600 hover:bg-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {token ? (
            <button
              type="button"
              onClick={logout}
              className="hidden rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 sm:inline-flex"
            >
              Log out
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:text-black"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2563eb] hover:border-[#2563eb]"
              >
                Sign up
              </Link>
            </div>
          )}

          <span className="hidden h-1.5 w-1.5 rounded-full bg-green-500 md:inline-block" />
        </div>
      </div>
    </header>
  );
}
