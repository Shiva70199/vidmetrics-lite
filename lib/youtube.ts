import { DateTime } from "luxon";

export interface RawVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  views: number;
  likes: number;
}

export interface EnrichedVideo extends RawVideo {
  engagementRate: number;
  trendingScore: number;
  daysSincePublished: number;
}

export interface ChannelVideosResult {
  channelId: string;
  channelTitle: string | null;
  videos: EnrichedVideo[];
}

function getApiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error("YOUTUBE_API_KEY is not set in the environment.");
  }
  return key;
}

export function extractChannelIdentifier(rawUrl: string): string {
  const url = rawUrl.trim();

  // Handle bare handles like @channel
  if (url.startsWith("@")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;

    // /channel/CHANNEL_ID
    const channelMatch = pathname.match(/\/channel\/([^/]+)/);
    if (channelMatch) return channelMatch[1];

    // /@handle
    const handleMatch = pathname.match(/\/(@[^/]+)/);
    if (handleMatch) return handleMatch[1];

    // /user/USERNAME
    const userMatch = pathname.match(/\/user\/([^/]+)/);
    if (userMatch) return userMatch[1];

    // Fallback to hostname + path if nothing else
    return pathname.replace(/^\/+/, "");
  } catch {
    // Not a URL, return raw
    return url;
  }
}

async function resolveChannelId(identifier: string): Promise<string> {
  const apiKey = getApiKey();

  if (identifier.startsWith("UC")) {
    return identifier;
  }

  // Handle @handle
  if (identifier.startsWith("@")) {
    const handle = identifier.slice(1);
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "id");
    url.searchParams.set("forHandle", handle);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error("Failed to resolve YouTube handle.");
    }
    const data = (await res.json()) as any;
    const item = data.items?.[0];
    if (!item?.id) {
      throw new Error("Channel not found for handle.");
    }
    return item.id as string;
  }

  // Assume username
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "id");
  url.searchParams.set("forUsername", identifier);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to resolve YouTube username.");
  }
  const data = (await res.json()) as any;
  const item = data.items?.[0];
  if (!item?.id) {
    throw new Error("Channel not found for username.");
  }
  return item.id as string;
}

export async function fetchChannelVideos(
  channelUrl: string,
  maxResults = 30
): Promise<ChannelVideosResult> {
  const identifier = extractChannelIdentifier(channelUrl);
  const apiKey = getApiKey();
  const channelId = await resolveChannelId(identifier);

  // 1) search.list to get latest videos
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("maxResults", String(maxResults));
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    throw new Error("Failed to fetch videos for channel.");
  }
  const searchData = (await searchRes.json()) as any;

  const videoIds: string[] =
    searchData.items?.map((item: any) => item.id?.videoId).filter(Boolean) ??
    [];

  if (videoIds.length === 0) {
    return { channelId, channelTitle: null, videos: [] };
  }

  // 2) videos.list to get stats
  const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  videosUrl.searchParams.set("part", "snippet,statistics");
  videosUrl.searchParams.set("id", videoIds.join(","));
  videosUrl.searchParams.set("key", apiKey);

  const videosRes = await fetch(videosUrl.toString());
  if (!videosRes.ok) {
    throw new Error("Failed to fetch video statistics.");
  }
  const videosData = (await videosRes.json()) as any;

  const now = DateTime.now();
  const thirtyDaysAgo = now.minus({ days: 30 });

  const rawVideos: RawVideo[] =
    videosData.items?.map((item: any) => {
      const stats = item.statistics ?? {};
      const snippet = item.snippet ?? {};
      return {
        id: item.id as string,
        title: snippet.title ?? "Untitled",
        thumbnailUrl:
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          "",
        publishedAt: snippet.publishedAt ?? "",
        views: Number(stats.viewCount ?? 0),
        likes: Number(stats.likeCount ?? 0)
      };
    }) ?? [];

  const enriched: EnrichedVideo[] = rawVideos
    .map((video) => {
      const published = DateTime.fromISO(video.publishedAt);
      const days = Math.max(now.diff(published, "days").days, 1);
      const engagementRate =
        video.views > 0 ? (video.likes / video.views) * 100 : 0;
      const trendingScore = video.views / days;
      return {
        ...video,
        daysSincePublished: days,
        engagementRate,
        trendingScore
      };
    })
    .filter((video) => {
      const published = DateTime.fromISO(video.publishedAt);
      return published >= thirtyDaysAgo;
    })
    .sort((a, b) => b.views - a.views);

  const channelTitle = searchData.items?.[0]?.snippet?.channelTitle ?? null;

  return { channelId, channelTitle, videos: enriched };
}

