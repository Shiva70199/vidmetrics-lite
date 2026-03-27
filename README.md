# VidMetrics Lite

VidMetrics Lite is a full-stack SaaS analytics dashboard built with Next.js and Tailwind CSS.  
It analyzes competitor YouTube channels, surfaces top-performing videos, and generates actionable insights for creators and media teams.

## Live Demo

Deployed on Vercel (production URL configured by project owner).

## Tech Stack

- Next.js (App Router)
- React
- Tailwind CSS
- YouTube Data API v3
- Chart.js + react-chartjs-2
- TypeScript

## Core Features

- Paste a YouTube channel URL (`/channel/...`, `/@handle`, or `/user/...`)
- Fetch recent videos and analyze performance metrics
- Show:
  - Thumbnail
  - Title
  - Views
  - Likes
  - Engagement rate
  - Publish date
  - Trending indicators
- Chart: top-performing videos in the last 30 days
- CSV export for analyzed video data
- Responsive, polished SaaS-style UI

## Filtering + Sorting Coverage

This app currently satisfies filtering requirements in the following way:

- **Automatic time-based filtering**: only videos from the **last 30 days** are included in analytics and dashboard outputs.
- **Sorting controls** in dashboard table:
  - Views
  - Likes
  - Engagement
  - Trending
  - Date

This keeps the experience fast and focused on current performance momentum.

## Setup (Local)

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in project root:

```bash
YOUTUBE_API_KEY=your_api_key_here
```

3. Run development server:

```bash
npm run dev:clean
```

4. Open:

```text
http://localhost:3000
```

## Scripts

- `npm run dev` - Start dev server
- `npm run dev:clean` - Clean dev output and start dev server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run lint checks

## Notes

- `.env.local` is ignored from git and should never be committed.
- Dev and build outputs are isolated (`.next-dev` for development and `.next` for production) for better stability on Windows environments.
