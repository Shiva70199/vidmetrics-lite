import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-[#f7f3ed]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black bg-black text-[11px] font-semibold text-white">
            VM
          </div>
          <span className="text-sm font-semibold tracking-tight text-black sm:text-base">
            VidMetrics <span className="text-neutral-500">Lite</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 text-xs text-neutral-600">
          <span className="hidden md:inline">Creators of VidMetrics</span>
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span className="rounded-full border border-black bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
            Beta
          </span>
        </div>
      </div>
    </header>
  );
}

