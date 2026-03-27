import { LayoutShell } from "@/components/LayoutShell";
import { ChannelInput } from "@/components/ChannelInput";

export default function HomePage() {
  return (
    <LayoutShell>
      <section className="relative flex flex-1 flex-col justify-center py-10 sm:py-16">
        <div className="mx-auto w-full max-w-4xl">
          <p className="section-title tracking-[0.3em] text-xs text-neutral-500">
            VIDMETRICS LITE
          </p>
          <h1 className="heading-xl mt-5 max-w-3xl">
            Understand your YouTube competitors{" "}
            <span className="underline decoration-[0.2em] decoration-[#ff4b1f] underline-offset-4">
              in seconds.
            </span>
          </h1>
          <p className="muted-copy mt-6 max-w-2xl">
            Paste any channel URL to instantly surface top-performing videos
            from the last 30 days — with engagement and trending signals built
            in.
          </p>
          <ChannelInput />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="premium-card premium-card-hover p-6">
              <p className="section-title">Top Videos Instantly</p>
              <p className="mt-3 text-base font-semibold text-neutral-900">
                See what is winning right now
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Automatically rank recent uploads by performance so you can
                identify patterns fast.
              </p>
            </div>
            <div className="premium-card premium-card-hover p-6">
              <p className="section-title">Engagement Insights</p>
              <p className="mt-3 text-base font-semibold text-neutral-900">
                Spot high-signal content
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Compare views and likes with engagement rate and trending score
                in one clean table.
              </p>
            </div>
            <div className="premium-card premium-card-hover p-6 sm:col-span-2 lg:col-span-1">
              <p className="section-title">Built for Creators &amp; Teams</p>
              <p className="mt-3 text-base font-semibold text-neutral-900">
                Enterprise-ready analytics UX
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Fast, responsive, and presentation-ready for client calls and
                internal reviews.
              </p>
            </div>
          </div>
        </div>
      </section>
    </LayoutShell>
  );
}

