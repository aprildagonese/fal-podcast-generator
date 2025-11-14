# Reddit Daily Sync Setup

This guide explains how to set up the automated daily Reddit sync that feeds fresh content into your Gradient Knowledge Base.

## Overview

The system fetches top posts from `/r/MachineLearning` and `/r/LocalLLaMA` daily, formats them as markdown, and uploads them to your Gradient Knowledge Base via the API.

## Architecture

```
[DigitalOcean Function - Scheduled 12AM UTC]
    ↓
[Triggers POST /api/reddit-sync]
    ↓
1. Fetch top 25 posts from each subreddit (last 24 hours)
2. Format as markdown
3. Upload to Gradient Knowledge Base
    ↓
[KB now has fresh Reddit data for agent queries]
```

## Prerequisites

1. **Gradient API Key** - Get from your Gradient dashboard
2. **Workspace ID** - Found in Gradient dashboard URL
3. **Knowledge Base ID** - Found in your KB settings
4. **DigitalOcean Functions** - Set up via doctl CLI

## Setup Steps

### 1. Configure Environment Variables

Add these to your `.env` file:

```bash
# Gradient Knowledge Base
GRADIENT_WORKSPACE_ID=your_workspace_id
GRADIENT_KB_ID=your_kb_id
GRADIENT_API_KEY=your_api_key

# Security token for the sync endpoint
SYNC_TOKEN=generate_a_random_secure_string

# Your deployed app URL
APP_URL=https://your-app.ondigitalocean.app
```

To generate a secure token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Test the Sync Locally

First, test that the Reddit API and Gradient KB integration work:

```bash
curl -X POST http://localhost:3000/api/reddit-sync \
  -H "Authorization: Bearer YOUR_SYNC_TOKEN"
```

You should see output like:
```json
{
  "success": true,
  "timestamp": "2025-11-14T12:00:00.000Z",
  "synced": ["MachineLearning", "LocalLLaMA"],
  "errors": []
}
```

### 3. Deploy to DigitalOcean App Platform

Ensure your environment variables are set in the App Platform dashboard:
- `GRADIENT_WORKSPACE_ID`
- `GRADIENT_KB_ID`
- `GRADIENT_API_KEY`
- `SYNC_TOKEN`

### 4. Deploy the DigitalOcean Function

Install doctl if you haven't:
```bash
brew install doctl  # macOS
# or follow: https://docs.digitalocean.com/reference/doctl/how-to/install/
```

Connect to your DO account:
```bash
doctl auth init
```

Deploy the function:
```bash
cd functions
doctl serverless deploy --remote-build
```

### 5. Configure the Function Environment

Set environment variables for the function:
```bash
doctl serverless functions config set APP_URL https://your-app.ondigitalocean.app
doctl serverless functions config set SYNC_TOKEN your_sync_token_here
```

### 6. Verify the Schedule

Check that the function is scheduled correctly:
```bash
doctl serverless functions list
```

You should see `reddit-sync` with a trigger set for `0 0 * * *` (daily at midnight UTC).

### 7. Manual Test the Function

Trigger the function manually to test:
```bash
doctl serverless functions invoke daily-tasks/reddit-sync
```

## Monitoring

### Check Function Logs

View logs from the scheduled function:
```bash
doctl serverless activations logs --function daily-tasks/reddit-sync --follow
```

### Check Sync Results

View your app's logs to see the sync results:
```bash
doctl apps logs YOUR_APP_ID --type run --follow
```

### Verify in Gradient KB

1. Go to your Gradient dashboard
2. Open your Knowledge Base
3. Look for documents named `reddit-MachineLearning-YYYY-MM-DD.md` and `reddit-LocalLLaMA-YYYY-MM-DD.md`
4. They should be updated daily with the latest posts

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

### Change Schedule

Edit `functions/project.yml`:
```yaml
cron: "0 8 * * *"  # 8 AM UTC instead of midnight
```

### Fetch More Posts

Edit `lib/reddit-sync.ts`:
```typescript
const posts = await fetchSubredditPosts(subreddit, 50, 'day');  // Fetch 50 instead of 25
```

## Troubleshooting

### "Unauthorized" Error
- Check that `SYNC_TOKEN` matches in both the function and your app

### "Reddit API error"
- Reddit's public API is rate-limited. Wait a few minutes and try again.
- Consider adding exponential backoff if this happens frequently

### "Gradient KB API error"
- Verify `GRADIENT_WORKSPACE_ID`, `GRADIENT_KB_ID`, and `GRADIENT_API_KEY` are correct
- Check that your API key has write permissions to the KB

### Function Not Running
- Check the cron schedule: `doctl serverless functions get daily-tasks/reddit-sync`
- View function logs for errors
- Manually trigger to test: `doctl serverless functions invoke daily-tasks/reddit-sync`

## Cost Considerations

- **Reddit API**: Free, rate-limited
- **DO Functions**: ~$0.000017 per GB-second (minimal for this use case)
- **Gradient KB**: Check your plan's document storage limits

For daily syncs with 2 subreddits, expect:
- ~2 function invocations/day
- ~1-2 seconds execution time
- ~256MB memory
- **Cost**: < $0.01/month

## Next Steps

Once this is working, you can:
1. Add more subreddits to track
2. Set up similar syncs for other sources (HackerNews, ArXiv, etc.)
3. Add Slack/email notifications for sync failures
4. Create a dashboard to view sync status
