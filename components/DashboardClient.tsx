"use client";

import { useEffect, useMemo, useState } from "react";
import { ViewsBarChart } from "@/components/ViewsBarChart";

interface DashboardClientProps {
  channelUrl: string;
}

interface ApiVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  views: number;
  likes: number;
  engagementRate: number;
  trendingScore: number;
  daysSincePublished: number;
}

interface ApiResponse {
  channelId: string;
  channelTitle: string | null;
  videos: ApiVideo[];
}

type SortKey =
  | "views"
  | "likes"
  | "publishedAt"
  | "engagementRate"
  | "trendingScore";

export function DashboardClient({ channelUrl }: DashboardClientProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("views");
  const [timeFilterDays, setTimeFilterDays] = useState<7 | 14 | 30>(30);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/youtube?channel=${encodeURIComponent(channelUrl)}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to fetch channel data.");
        }
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Unexpected error.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [channelUrl]);

  const filteredVideos = useMemo(() => {
    const videos = data?.videos ?? [];
    const query = searchQuery.trim().toLowerCase();

    return videos.filter((video) => {
      const days = Number(video?.daysSincePublished || 0);
      const withinWindow = days <= timeFilterDays;
      if (!withinWindow) return false;

      if (!query) return true;
      const title = (video?.title ?? "").toLowerCase();
      return title.includes(query);
    });
  }, [data?.videos, searchQuery, timeFilterDays]);

  const sortedVideos = useMemo(() => {
    const copy = [...filteredVideos];
    copy.sort((a, b) => {
      if (sortKey === "publishedAt") {
        return (
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      }
      return Number((b as any)[sortKey]) - Number((a as any)[sortKey]);
    });
    return copy;
  }, [filteredVideos, sortKey]);

  const overview = useMemo(() => {
    const videos = filteredVideos;
    const total = videos.length;
    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
    const totalEngagement = videos.reduce(
      (sum, v) => sum + (v.engagementRate || 0),
      0
    );

    const avgViews = total > 0 ? totalViews / total : 0;
    const avgEngagementRate = total > 0 ? totalEngagement / total : 0;

    const top = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
    const topTitle = top?.title ?? "—";
    const topViews = top?.views ?? 0;

    return {
      total,
      avgViews,
      avgEngagementRate,
      topTitle,
      topViews
    };
  }, [filteredVideos]);

  const whyItWorks = useMemo(() => {
    const videos = filteredVideos;
    if (videos.length < 3) {
      return [
        "Not enough recent data to generate insights yet. Try a channel with more uploads in the last 30 days."
      ];
    }

    const byDate = [...videos].sort(
      (a, b) =>
        new Date(b.publishedAt || 0).getTime() -
        new Date(a.publishedAt || 0).getTime()
    );

    const midpoint = Math.max(1, Math.floor(byDate.length / 2));
    const recent = byDate.slice(0, midpoint);
    const older = byDate.slice(midpoint);

    const avg = (arr: ApiVideo[], key: "views" | "engagementRate") => {
      if (!arr.length) return 0;
      const total = arr.reduce((s, v) => s + Number(v[key] || 0), 0);
      return total / arr.length;
    };

    const insights: string[] = [];

    // Short vs long (proxy: title length)
    const titles = videos.map((v) => (v.title ?? "").length).filter((n) => n > 0);
    const titleMedian = titles.length
      ? [...titles].sort((a, b) => a - b)[Math.floor(titles.length / 2)]
      : 0;
    if (titleMedian > 0) {
      const short = videos.filter((v) => (v.title?.length ?? 0) <= titleMedian);
      const long = videos.filter((v) => (v.title?.length ?? 0) > titleMedian);
      const shortViews = avg(short, "views");
      const longViews = avg(long, "views");
      if (short.length >= 2 && long.length >= 2) {
        if (shortViews > longViews * 1.1) {
          insights.push("Shorter-titled videos are performing better on this channel right now.");
        } else if (longViews > shortViews * 1.1) {
          insights.push("Longer-titled videos are outperforming shorter ones—this audience may prefer more specific topics.");
        }
      }
    }

    // Recent vs older
    const recentEng = avg(recent, "engagementRate");
    const olderEng = avg(older, "engagementRate");
    if (recent.length >= 2 && older.length >= 2) {
      if (recentEng > olderEng * 1.15) {
        insights.push("Recent uploads are getting higher engagement—momentum is improving.");
      } else if (olderEng > recentEng * 1.15) {
        insights.push("Older uploads are still driving stronger engagement—recent topics may need tightening.");
      }
    }

    // High engagement pattern + outliers
    const views = videos.map((v) => v.views || 0).sort((a, b) => a - b);
    const medianViews = views[Math.floor(views.length / 2)] || 0;
    const outliers = videos.filter((v) => (v.views || 0) >= medianViews * 2 && medianViews > 0);

    const engRates = videos.map((v) => v.engagementRate || 0).sort((a, b) => a - b);
    const medEng = engRates[Math.floor(engRates.length / 2)] || 0;
    const highEngCount = videos.filter((v) => (v.engagementRate || 0) >= Math.max(medEng * 1.5, 4)).length;

    if (outliers.length >= 1) {
      insights.push(
        `There ${outliers.length === 1 ? "is" : "are"} ${outliers.length} clear performance outlier${outliers.length === 1 ? "" : "s"}—review the topic/format and replicate what worked.`
      );
    }
    if (highEngCount >= 2) {
      insights.push("Multiple videos show high engagement—your audience is responding well to certain topics or hooks.");
    }

    return insights.slice(0, 3).length ? insights.slice(0, 3) : [
      "Performance is fairly consistent across uploads—try changing topics, pacing, or packaging to create breakout videos."
    ];
  }, [filteredVideos]);

  const performanceDistribution = useMemo(() => {
    const videos = filteredVideos;
    const n = videos.length;
    if (n === 0) {
      return { high: 0, medium: 0, low: 0, total: 0 };
    }

    const sorted = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0));
    const highCount = Math.max(1, Math.ceil(n * 0.2));
    const lowCount = Math.max(1, Math.ceil(n * 0.3));
    const mediumCount = Math.max(0, n - highCount - lowCount);

    return {
      high: Math.min(highCount, n),
      medium: Math.min(mediumCount, n),
      low: Math.min(lowCount, n),
      total: n
    };
  }, [filteredVideos]);

  function exportCsv(videos: ApiVideo[]) {
    const headers = [
      "title",
      "views",
      "likes",
      "engagementRate",
      "trendingScore",
      "publishedAt",
      "videoId"
    ];
    const escapeCell = (value: string) =>
      `"${value.replaceAll('"', '""').replaceAll("\n", " ")}"`;
    const rows = videos.map((v) => [
      escapeCell(v.title),
      String(v.views),
      String(v.likes),
      v.engagementRate.toFixed(2),
      v.trendingScore.toFixed(2),
      escapeCell(v.publishedAt),
      escapeCell(v.id)
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vidmetrics-lite-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-44 rounded bg-neutral-200 animate-pulse" />
          <div className="h-9 w-80 rounded bg-neutral-200 animate-pulse" />
          <div className="h-4 w-72 rounded bg-neutral-200 animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-24 rounded-xl bg-neutral-200 animate-pulse" />
          <div className="h-24 rounded-xl bg-neutral-200 animate-pulse" />
          <div className="h-24 rounded-xl bg-neutral-200 animate-pulse" />
        </div>
        <div className="h-72 w-full rounded-xl bg-neutral-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-card p-5">
        <p className="text-sm font-semibold text-neutral-900">
          We couldn’t load this channel.
        </p>
        <p className="mt-1 text-sm text-neutral-600">{error}</p>
        <p className="mt-3 text-xs text-neutral-500">
          Tip: double-check the channel URL and make sure your API key is set.
        </p>
      </div>
    );
  }

  const sourceHost = (() => {
    try {
      const u = new URL(channelUrl);
      return u.hostname + (u.pathname?.length ? u.pathname : "");
    } catch {
      return channelUrl;
    }
  })();

  if (!data || (data?.videos?.length ?? 0) === 0) {
    return (
      <div className="premium-card p-5">
        <p className="text-sm font-semibold text-neutral-900">
          No recent videos found.
        </p>
        <p className="mt-1 text-sm text-neutral-600">
          No recent videos found in the last 30 days. Try another channel.
        </p>
      </div>
    );
  }

  if (sortedVideos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="premium-card p-5 sm:p-6">
          <p className="section-title">Dashboard</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
            Analyzing: {data.channelTitle || "YouTube Channel"}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Source: <span className="font-medium text-neutral-900">{sourceHost}</span>
          </p>
        </div>
        <div className="premium-card p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="rounded-full border border-black bg-white px-3 py-2 text-sm font-semibold text-black"
              value={timeFilterDays}
              onChange={(e) => setTimeFilterDays(Number(e.target.value) as 7 | 14 | 30)}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos by title"
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-black"
            />
            <button
              type="button"
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              onClick={() => {
                setSearchQuery("");
                setTimeFilterDays(30);
              }}
            >
              Reset filters
            </button>
          </div>
          <p className="mt-4 text-sm text-neutral-700">
            No videos match the current filters. Try a wider time window or clear the search term.
          </p>
        </div>
      </div>
    );
  }

  const totalVideos = sortedVideos.length;
  const avgViews =
    sortedVideos.reduce((sum, v) => sum + (v?.views || 0), 0) /
    Math.max(totalVideos, 1);
  const topVideo = sortedVideos[0];
  const avgEngagement =
    sortedVideos.reduce((sum, v) => sum + (v?.engagementRate || 0), 0) /
    Math.max(totalVideos, 1);
  const avgTrending =
    sortedVideos.reduce((sum, v) => sum + (v?.trendingScore || 0), 0) /
    Math.max(totalVideos, 1);

  const sortedByDate = [...sortedVideos].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );
  const postingGaps = sortedByDate
    .map((v, i) => {
      if (i === 0) return null;
      const prev = sortedByDate[i - 1];
      const gapMs =
        new Date(v.publishedAt).getTime() - new Date(prev.publishedAt).getTime();
      return gapMs / (1000 * 60 * 60 * 24);
    })
    .filter((x): x is number => typeof x === "number");
  const avgPostingGapDays =
    postingGaps.reduce((sum, g) => sum + g, 0) / Math.max(postingGaps.length, 1);

  const trendingThreshold = Math.max(avgTrending * 1.35, 1);
  const highEngagementThreshold = Math.max(avgEngagement * 1.25, 3.5);

  const chartTop = [...sortedVideos].sort((a, b) => b.views - a.views).slice(0, 10);
  const chartLabels = chartTop.map((v) =>
    v.title.length > 18 ? `${v.title.slice(0, 18)}…` : v.title
  );
  const chartValues = chartTop.map((v) => v.views);
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="section-title">Dashboard</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-black sm:text-4xl">
            Analyzing: {data.channelTitle || "YouTube Channel"}
          </h2>
          <p className="text-sm text-neutral-600">
            Source: <span className="font-medium text-neutral-900">{sourceHost}</span>
          </p>
        </div>
        <button
          type="button"
          className="accent-button w-full sm:w-auto"
          onClick={() => exportCsv(sortedVideos)}
        >
          Export Data (CSV)
        </button>
      </div>

      <div className="premium-card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            className="rounded-full border border-black bg-white px-3 py-2 text-sm font-semibold text-black"
            value={timeFilterDays}
            onChange={(e) => setTimeFilterDays(Number(e.target.value) as 7 | 14 | 30)}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title"
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 outline-none focus:border-black focus:ring-2 focus:ring-black"
          />
          <button
            type="button"
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            onClick={() => {
              setSearchQuery("");
              setTimeFilterDays(30);
            }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* 1) Channel Performance Overview */}
      <div className="premium-card p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <p className="section-title">Channel Performance Overview</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            Summary of the last 30 days
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Videos analyzed
            </p>
            <p className="mt-2 text-2xl font-semibold text-black">
              {overview.total.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Average views
            </p>
            <p className="mt-2 text-2xl font-semibold text-black">
              {Math.round(overview.avgViews).toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Avg engagement rate
            </p>
            <p className="mt-2 text-2xl font-semibold text-black">
              {overview.avgEngagementRate.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Top performer
            </p>
            <p className="mt-2 line-clamp-2 text-sm font-semibold text-neutral-900">
              {overview.topTitle}
            </p>
            <p className="mt-2 text-sm text-neutral-700">
              {overview.topViews.toLocaleString()} views
            </p>
          </div>
        </div>
      </div>

      {/* 2) Why it works + distribution */}
      <div className="premium-card p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <p className="section-title">Why It Works</p>
          <p className="mt-2 text-lg font-semibold text-neutral-900">
            Patterns detected from recent performance
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ul className="space-y-3">
              {whyItWorks.map((insight, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-800"
                >
                  {insight}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Performance distribution
            </p>
            <p className="mt-2 text-sm text-neutral-700">
              Based on views (top 20% / middle 50% / bottom 30%).
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-black">High</span>
                <span className="text-neutral-700">
                  {performanceDistribution.high}/{performanceDistribution.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-200">
                <div
                  className="h-2 rounded-full bg-black"
                  style={{
                    width: `${
                      performanceDistribution.total
                        ? (performanceDistribution.high /
                            performanceDistribution.total) *
                          100
                        : 0
                    }%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-black">Medium</span>
                <span className="text-neutral-700">
                  {performanceDistribution.medium}/{performanceDistribution.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-200">
                <div
                  className="h-2 rounded-full bg-[#ff4b1f]/70"
                  style={{
                    width: `${
                      performanceDistribution.total
                        ? (performanceDistribution.medium /
                            performanceDistribution.total) *
                          100
                        : 0
                    }%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-black">Low</span>
                <span className="text-neutral-700">
                  {performanceDistribution.low}/{performanceDistribution.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-200">
                <div
                  className="h-2 rounded-full bg-neutral-500"
                  style={{
                    width: `${
                      performanceDistribution.total
                        ? (performanceDistribution.low /
                            performanceDistribution.total) *
                          100
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="premium-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Total Videos
          </p>
          <p className="mt-3 text-2xl font-semibold text-black">{totalVideos}</p>
        </div>
        <div className="premium-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Avg Views
          </p>
          <p className="mt-3 text-2xl font-semibold text-black">
            {Math.round(avgViews).toLocaleString()}
          </p>
        </div>
        <div className="premium-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Top Video
          </p>
          <p className="mt-3 line-clamp-2 text-sm font-medium text-neutral-900">
            {topVideo.title}
          </p>
        </div>
      </div>

      <div className="premium-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-title">Top Performing Video</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900 sm:text-xl">
              {topVideo.title}
            </p>
          </div>
          <a
            className="rounded-full border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#ff4b1f] hover:text-white"
            href={`https://www.youtube.com/watch?v=${topVideo.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Open on YouTube
          </a>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-[220px,1fr]">
          {topVideo.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={topVideo.thumbnailUrl}
              alt={topVideo.title}
              className="h-[124px] w-full rounded-xl border border-neutral-200 object-cover md:h-[128px]"
            />
          ) : (
            <div className="h-[124px] w-full rounded-xl bg-neutral-200 md:h-[128px]" />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Views
              </p>
              <p className="mt-2 text-2xl font-semibold text-black">
                {topVideo.views.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                Engagement rate
              </p>
              <p className="mt-2 text-2xl font-semibold text-black">
                {topVideo.engagementRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="premium-card p-5 sm:p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <p className="section-title">Top Performing Videos (Last 30 Days)</p>
          </div>
          <div className="h-72">
            <ViewsBarChart labels={chartLabels} values={chartValues} />
          </div>
        </div>
        <div className="premium-card p-5 sm:p-6">
          <p className="section-title">Insights</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[#ff4b1f]/30 bg-[#ff4b1f]/10 px-4 py-4">
              <p className="text-sm font-semibold text-neutral-900">
                 Top Performer
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-neutral-700">
                {topVideo.title}
              </p>
            </div>
            <div className="rounded-xl border border-[#ff4b1f]/30 bg-[#ff4b1f]/10 px-4 py-4">
              <p className="text-sm font-semibold text-neutral-900"> Average Engagement Rate</p>
              <p className="mt-2 text-2xl font-extrabold text-black">
                {avgEngagement.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl border border-[#ff4b1f]/30 bg-[#ff4b1f]/10 px-4 py-4">
              <p className="text-sm font-semibold text-neutral-900">
                 Posting Frequency
              </p>
              <p className="mt-2 text-2xl font-extrabold text-black">
                Every {avgPostingGapDays.toFixed(1)} days
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Based on gaps between uploads in the last 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-title">Videos</p>
            <p className="mt-2 text-lg font-semibold text-neutral-900">
              Ranked videos (Last 30 Days)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-700">
            <span className="rounded-full bg-[#ff4b1f]/10 px-3 py-1 font-semibold text-[#a62b12]">
              Sort by
            </span>
            <select
              className="rounded-full border border-black bg-white px-3 py-1 text-xs font-semibold text-black"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option value="views">Views</option>
              <option value="likes">Likes</option>
              <option value="engagementRate">Engagement</option>
              <option value="trendingScore">Trending</option>
              <option value="publishedAt">Date</option>
            </select>
          </div>
        </div>
        <div className="table-surface">
          <table>
            <thead>
              <tr>
                <th>Video</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Engagement %</th>
                <th>Badges</th>
                <th>Open</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedVideos.map((video, index) => {
                const isTop3 = index < 3 && sortKey === "views";
                const isTrending = video.trendingScore >= trendingThreshold;
                const isHighEngagement =
                  video.engagementRate >= highEngagementThreshold;
                return (
                <tr
                  key={video.id}
                  className={isTop3 ? "bg-[#fff7ef]" : undefined}
                >
                  <td>
                    <div className="flex items-center gap-4 py-1">
                      {video.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="h-12 w-20 rounded-lg border border-neutral-200 object-cover"
                        />
                      ) : (
                        <div className="h-12 w-20 rounded-lg bg-neutral-200" />
                      )}
                      <div className="min-w-0">
                        <span className="line-clamp-2 text-sm font-medium text-neutral-900">
                          {video.title}
                        </span>
                        {isTop3 && (
                          <span className="mt-1 inline-flex items-center rounded-full border border-black bg-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                            Top {index + 1}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{video.views.toLocaleString()}</td>
                  <td>{video.likes.toLocaleString()}</td>
                  <td>{video.engagementRate.toFixed(1)}%</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {isTrending && (
                        <span className="rounded-full border border-black bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                          Trending
                        </span>
                      )}
                      {isHighEngagement && (
                        <span className="rounded-full border border-[#ff4b1f]/30 bg-[#ff4b1f]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a62b12]">
                          High Engagement
                        </span>
                      )}
                      {!isTrending && !isHighEngagement && (
                        <span className="text-xs text-neutral-500">—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <a
                      className="inline-flex items-center justify-center rounded-full border border-black bg-black px-3 py-1 text-[11px] font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#ff4b1f]"
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  </td>
                  <td>
                    {new Date(video.publishedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

