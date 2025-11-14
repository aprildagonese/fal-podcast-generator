# Reddit Sync Setup

This guide explains how to manually sync Reddit content to your Gradient Knowledge Base.

**Note:** Automated scheduling (via GitHub Actions or DO Functions) doesn't work because Reddit blocks cloud/datacenter IP addresses. Manual sync from your local machine works perfectly.

## Overview

The system fetches top posts from `/r/MachineLearning` and `/r/LocalLLaMA` daily, formats them as markdown, and uploads them to your Gradient Knowledge Base via the API.

## How It Works

```
[Manual curl command from your machine]
    ↓
[POST /api/reddit-sync endpoint]
    ↓
1. Fetch top 25 posts from each subreddit (last 24 hours)
2. Format as markdown
3. Upload to DO Spaces (reddit-sync/ folder)
    ↓
[KB crawls the folder at midnight UTC]
    ↓
[Fresh Reddit data available to agent]
```

## Prerequisites

1. DO Spaces bucket configured
2. Gradient Knowledge Base with `reddit-sync/` folder as a data source
3. Environment variables in `.env`

## Setup Steps

### 1. Ensure Environment Variables are Set

Your `.env` should already have:

```bash
# DO Spaces (already configured)
DO_SPACES_ACCESS_KEY_ID=...
DO_SPACES_SECRET_ACCESS_KEY=...
DO_SPACES_BUCKET=...

# Security token for the sync endpoint
SYNC_TOKEN=your_secure_token_here
```

### 2. Configure Gradient Knowledge Base

1. Go to your Gradient KB dashboard
2. Add a data source
3. Use URL: `https://your-bucket.tor1.digitaloceanspaces.com/reddit-sync/`
4. Set crawl schedule to daily (midnight UTC or later)

### 3. Run Manual Sync

Before generating episodes or for your demo:

```bash
# Set your token
export SYNC_TOKEN=your_token_from_env_file

# Run the sync
curl -X POST http://localhost:3000/api/reddit-sync \
  -H "Authorization: Bearer $SYNC_TOKEN" \
  | jq '.'
```

Or against your deployed app:
```bash
curl -X POST https://your-app.ondigitalocean.app/api/reddit-sync \
  -H "Authorization: Bearer $SYNC_TOKEN" \
  | jq '.'
```

Expected output:
```json
{
  "success": true,
  "timestamp": "2025-11-14T21:37:58.003Z",
  "synced": ["MachineLearning", "LocalLLaMA"],
  "errors": [],
  "urls": [...],
  "message": "Files uploaded successfully. Your KB will crawl them on its next scheduled refresh (midnight UTC)."
}
```

## Verification

### Check DO Spaces

Visit your Spaces bucket to see the uploaded markdown files:
- `https://your-bucket.tor1.digitaloceanspaces.com/reddit-sync/reddit-MachineLearning-2025-11-14.md`
- `https://your-bucket.tor1.digitaloceanspaces.com/reddit-sync/reddit-LocalLLaMA-2025-11-14.md`

### Verify in Gradient KB

After the KB crawls at midnight UTC:
1. Go to your Gradient dashboard
2. Open your Knowledge Base
3. The Reddit content should be indexed and available to your agent

## Customization

### Change Subreddits

Edit `lib/reddit-sync.ts`:
```typescript
const SUBREDDITS = [
  'MachineLearning',
  'LocalLLaMA',
  'artificial',  // Add more here
];
```

### Fetch More Posts

Edit `lib/reddit-sync.ts`:
```typescript
const posts = await fetchSubredditPosts(subreddit, 50, 'day');  // Fetch 50 instead of 25
```

## Why Not Automated?

We initially tried GitHub Actions and DigitalOcean Functions for automated daily sync, but Reddit blocks requests from cloud/datacenter IP addresses.

**Potential solutions** (for future implementation):
1. Use Reddit's Official API with OAuth (requires app approval)
2. Use a proxy service (costs money)
3. Keep it manual (works perfectly for demos!)

## Cost Considerations

- **Reddit API**: Free (using public JSON endpoints)
- **DO Spaces**: Storage for markdown files (pennies per month)
- **Gradient KB**: Check your plan's document storage limits

Manual syncs have zero compute costs!
