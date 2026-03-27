import { NextResponse } from "next/server";
import { fetchChannelVideos } from "@/lib/youtube";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");

  if (!channel) {
    return NextResponse.json(
      { error: "Missing channel query parameter." },
      { status: 400 }
    );
  }

  try {
    const data = await fetchChannelVideos(channel);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("YouTube API error", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch YouTube data." },
      { status: 500 }
    );
  }
}

