import { LayoutShell } from "@/components/LayoutShell";
import { DashboardClient } from "@/components/DashboardClient";

function decodeChannelParam(channelParam?: string) {
  if (!channelParam) return null;
  try {
    return decodeURIComponent(channelParam);
  } catch {
    return channelParam;
  }
}

export default function DashboardPage({
  searchParams
}: {
  searchParams?: { channel?: string };
}) {
  const channel = decodeChannelParam(searchParams?.channel);

  if (!channel) {
    return (
      <LayoutShell>
        <section className="mx-auto w-full max-w-5xl py-8 sm:py-10">
          <h1 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-4 text-sm text-red-700">
            Please enter a valid YouTube channel URL
          </p>
        </section>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-8 sm:gap-8 sm:py-10">
        <DashboardClient channelUrl={channel} />
      </section>
    </LayoutShell>
  );
}

