"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ChannelInputProps {
  initialValue?: string;
}

export function ChannelInput({ initialValue = "" }: ChannelInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!value.trim()) {
      setError("Paste a YouTube channel URL to get started.");
      return;
    }

    setLoading(true);
    try {
      const encoded = encodeURIComponent(value.trim());
      router.push(`/dashboard?channel=${encoded}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center"
    >
      <div className="relative flex-1">
        <input
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/@your-competitor"
          className="input-surface h-14 pr-28 sm:pr-32"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Channel URL
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="accent-button h-14 whitespace-nowrap"
      >
        {loading ? "Analyzing…" : "Analyze Channel"}
      </button>
      {error && (
        <p className="text-xs text-rose-300 sm:text-sm" aria-live="polite">
          {error}
        </p>
      )}
    </form>
  );
}

