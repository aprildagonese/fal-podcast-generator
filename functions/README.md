# DigitalOcean Functions - Daily Podcast Generator

This directory contains the DO Function that runs daily to automatically generate new podcast episodes.

## Setup

### 1. Install doctl (DigitalOcean CLI)

```bash
# macOS
brew install doctl

# Or download from https://docs.digitalocean.com/reference/doctl/how-to/install/
```

### 2. Authenticate

```bash
doctl auth init
```

### 3. Create a namespace (if you don't have one)

```bash
doctl serverless namespaces create ai-podcast
doctl serverless namespaces list
```

### 4. Connect to namespace

```bash
doctl serverless connect
```

### 5. Set environment variables

Create a `.env` file in the `functions/` directory:

```bash
APP_URL=https://your-app-platform-url.ondigitalocean.app
```

### 6. Deploy the function

```bash
cd functions
doctl serverless deploy daily-podcast
```

### 7. Verify deployment

```bash
doctl serverless functions list
doctl serverless activations list
```

## Schedule

The function is configured to run **daily at 8:00 AM UTC**.

You can modify the schedule in `project.yml`:
- `'0 8 * * *'` = Daily at 8 AM UTC
- `'0 */6 * * *'` = Every 6 hours
- `'0 9 * * 1-5'` = Weekdays at 9 AM

Format: `minute hour day month weekday`

## Manual Trigger (for testing)

You can manually invoke the function:

```bash
doctl serverless functions invoke daily-podcast/daily-podcast
```

## Monitoring

View function logs:

```bash
doctl serverless activations logs --follow
```

View recent activations:

```bash
doctl serverless activations list daily-podcast/daily-podcast
```

## Cost

DO Functions pricing:
- 400,000 GB-seconds free per month
- $0.0000185 per GB-second after that

This function (256MB, ~60-120 seconds) costs ~$0.001 per run.
Daily runs = ~$0.36/month (well within free tier!)
