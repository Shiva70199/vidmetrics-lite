import Link from "next/link";
import { LayoutShell } from "@/components/LayoutShell";

export default function LandingPage() {
  return (
    <LayoutShell>
      <section className="relative flex flex-1 flex-col justify-center py-10 sm:py-16">
        <div className="mx-auto w-full max-w-4xl">
          <p className="section-title tracking-[0.3em] text-xs text-neutral-500">
            DATABOARD
          </p>
          <h1 className="heading-xl mt-5 max-w-3xl">
            Upload CSV datasets and analyze them{" "}
            <span className="underline decoration-[0.2em] decoration-[#2563eb] underline-offset-4">
              in seconds.
            </span>
          </h1>
          <p className="muted-copy mt-6 max-w-2xl">
            A clean workspace for uploading datasets, previewing rows, computing
            statistics, and building charts — all in one dashboard.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="accent-button h-14 px-8 text-center leading-[3.25rem]">
              Get started
            </Link>
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center rounded-full border border-neutral-300 bg-white px-8 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              Log in
            </Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="premium-card premium-card-hover p-6">
              <p className="section-title">CSV Upload</p>
              <p className="mt-3 text-base font-semibold text-neutral-900">
                Bring your data in quickly
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Upload named datasets with validation for empty files, duplicates, and invalid formats.
              </p>
            </div>
            <div className="premium-card premium-card-hover p-6">
              <p className="section-title">Analytics</p>
              <p className="mt-3 text-base font-semibold text-neutral-900">
                Min, max, and sum
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Compute statistics on numeric columns with clear error handling for edge cases.
              </p>
            </div>
            <div className="premium-card premium-card-hover p-6 sm:col-span-2 lg:col-span-1">
              <p className="section-title">Visualizations</p>
              <p className="mt-3 text-base font-semibold text-neutral-900">
                Bar, line, and scatter
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Build charts with Apache ECharts that update instantly as you change columns.
              </p>
            </div>
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}
