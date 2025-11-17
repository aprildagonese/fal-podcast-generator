# AI News Podcast Demo - Project Plan

## Overview
Automated AI news podcast system showcasing **DigitalOcean Gradient**, **Anthropic Claude**, and **fal.ai** for a hackathon demo.

## Architecture

### Daily Podcast Generation Flow
```
[Manual Reddit Sync - Run from local machine before demo]
    ↓
1. Fetch Reddit posts from 3 subreddits (last 24h)
2. Upload markdown files to DO Spaces (reddit-sync/ folder)
    ↓
[Gradient KB crawls at midnight UTC]
    ↓
[User triggers episode generation via UI]
    ↓
1. Query Gradient Agent (Anthropic-powered) with date-specific prompt
    ↓ (Agent auto-accesses Knowledge Base with all sources)
2. Agent returns: {title, script, topics[], sources[]}
    ↓
3. Call fal.ai TTS via DO Inference (with polling)
    ↓
4. Upload audio to DO Spaces
    ↓
5. Save metadata to episodes.json in Spaces
    ↓
[Next.js App displays new episode]
```

**Note:** Automated scheduling (DO Functions/GitHub Actions) was abandoned because Reddit blocks cloud/datacenter IP addresses. Manual sync from local machine works perfectly.

## Components

### 1. Data Collection (DO Knowledge Base)
- **Auto-scraping** configured URLs daily (except Reddit - see below)
- **Sources**:
  - Hacker News (https://news.ycombinator.com/) - auto-scraped by Gradient KB
  - ArXiv cs.AI recent papers - auto-scraped by Gradient KB
  - Hugging Face daily papers - auto-scraped by Gradient KB
  - MarkTechPost AI news - auto-scraped by Gradient KB
  - **Reddit posts** - manually synced (see Reddit Sync section below)
    - /r/MachineLearning
    - /r/LocalLLaMA
    - /r/artificial

#### Reddit Sync (Manual Process)
Reddit blocks cloud/datacenter IPs, so we sync manually from local machine:
1. Run `curl -X POST http://localhost:3000/api/reddit-sync -H "Authorization: Bearer $SYNC_TOKEN"`
2. System fetches top 25 posts from each subreddit (last 24h)
3. Formats as markdown with metadata (title, author, score, URL, etc.)
4. Uploads to DO Spaces at `reddit-sync/reddit-{subreddit}-{date}.md`
5. Gradient KB crawls the folder at midnight UTC
6. Files automatically overwrite if run multiple times same day

See `REDDIT_SYNC_SETUP.md` for full documentation.

### 2. Content Generation (Gradient + Anthropic)
- **Gradient Agent** configured with Knowledge Base access
- **Model**: Anthropic Claude Sonnet 4.5 (via Gradient)
- **Prompts** (in `lib/gradient.ts`):
  - **Full Episode**: Uses 2-step process with explicit date parsing instructions
    1. Find 20 most recent items across all sources (within 2 days)
    2. Select 3-5 most newsworthy stories
    3. Return JSON: `{title, script, topics[], sources[]}`
  - **Teaser**: Short, exciting teaser about most important recent story

#### Date Parsing Logic (Critical for Source Selection)
The prompt explicitly teaches the agent how to parse dates across different source formats:
- **ArXiv**: `YYMM.NNNNN` format (e.g., `2511.08548` = November 2025)
- **MarkTechPost**: `/YYYY/MM/DD/` in URL path
- **Reddit**: `reddit-{subreddit}-YYYY-MM-DD.md` filename
- **Hugging Face**: Similar to ArXiv

Agent must verify all sources are within 2 days of target date before including them.

#### Rate Limiting
- Anthropic API: 30,000 input tokens/minute
- Each request includes: prompt + agent instructions + **entire KB context**
- With large KB, this can be 15-20k tokens per request
- Limit to 1-2 test runs per minute to avoid rate limits
- For production, consider RAG optimization or prompt caching

### 3. Audio Generation (fal.ai TTS)
- **Model**: `fal-ai/elevenlabs/tts/multilingual-v2`
- **Voice**: "Rachel" (youthful female podcaster)
- **Process**:
  1. POST to fal.ai → get request ID
  2. Poll status endpoint until complete
  3. GET result to retrieve audio file URL

### 4. Storage (DO Spaces)
- **Audio files**: `{date}-full.mp3`, `{date}-teaser.mp3`
- **Metadata**: `episodes.json`
  ```json
  {
    "episodes": [
      {
        "id": "2025-01-12",
        "title": "GPT-5 Rumors and Small Model Revolution",
        "audioUrl": "https://...",
        "duration": 180,
        "topics": [...],
        "sources": [...],
        "createdAt": "2025-01-12T08:00:00Z"
      }
    ],
    "teasers": [...]
  }
  ```

### 5. Web App (Next.js on DO App Platform)
- **Features**:
  - Episode list with dates and "Latest" badges
  - Persistent audio player with playback speed controls (0.5x - 2x, default 1.25x)
  - Show notes with topics and source links
  - Smart generation controls:
    - "Generate Full Episode" button greys out when episode exists for today
    - "Generate Teaser" button greys out when teaser exists for today
    - Helpful messaging: "Generate a new one tomorrow"
  - Real-time generation progress indicators
  - Auto-play when clicking episodes
  - Uniform card heights for consistent UI

## API Endpoints

### Next.js Routes
- `POST /api/generate-episode` - Generate full 3-min episode
- `POST /api/generate-teaser` - Generate 5-sec teaser
- `GET /api/episodes` - Fetch episode list from Spaces
- `POST /api/reddit-sync` - Manual Reddit sync (requires `Authorization: Bearer $SYNC_TOKEN`)
- `GET /api/test-agent` - Test agent responses without generating full episode (useful for testing date parsing and source selection)

## Tech Stack

- **Frontend**: Next.js 16 (App Router + Turbopack), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Storage**: DigitalOcean Spaces (S3-compatible) via AWS SDK v3
- **AI Platform**: DigitalOcean Gradient (Anthropic Claude Sonnet 4.5)
- **TTS**: fal.ai ElevenLabs Multilingual v2 via DO Inference API
- **Reddit API**: Public JSON endpoints (unauthenticated)
- **Deployment**: DigitalOcean App Platform
- **Scheduling**: Manual (Reddit sync) - automated scheduling doesn't work due to Reddit IP blocking

## Environment Variables

```bash
# DigitalOcean Spaces
DO_SPACES_ACCESS_KEY_ID=your_access_key_id_here
DO_SPACES_SECRET_ACCESS_KEY=your_secret_access_key_here
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=ai-podcast-demo
DO_SPACES_REGION=nyc3

# Gradient AI Platform Agent
AGENT_ENDPOINT=https://your-agent-name.ondigitalocean.app
AGENT_ACCESS_KEY=your_endpoint_access_key_here

# DigitalOcean Inference API (for fal.ai TTS models)
MODEL_ACCESS_KEY=your_model_access_key_here

# Reddit Sync Security
SYNC_TOKEN=your_random_secure_token_here
```

See `.env.example` for template.

## Implementation Phases

### Phase 1: Project Setup ✓
- [x] Initialize Next.js with TypeScript
- [x] Install dependencies (@aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
- [x] Configure TailwindCSS
- [x] Set up project structure

### Phase 2: Core Services ✓
- [x] Gradient Agent client (`lib/gradient.ts`)
- [x] fal.ai TTS client with polling (`lib/fal.ts`)
- [x] DO Spaces client (`lib/spaces.ts`)
- [x] Metadata management (`lib/metadata.ts`)
- [x] Reddit API client (`lib/reddit.ts`)
- [x] Reddit sync orchestration (`lib/reddit-sync.ts`)

### Phase 3: API Routes ✓
- [x] Generate episode endpoint (`/api/generate-episode`)
- [x] Generate teaser endpoint (`/api/generate-teaser`)
- [x] Episodes list endpoint (`/api/episodes`)
- [x] Reddit sync endpoint (`/api/reddit-sync`)
- [x] Test agent endpoint (`/api/test-agent`)

### Phase 4: Frontend ✓
- [x] Homepage with episode list
- [x] Persistent audio player component with speed controls (0.5x-2x, default 1.25x)
- [x] Smart generation controls (grey out when content exists for today)
- [x] Episode cards with show notes and source links
- [x] Loading states and error handling
- [x] Auto-play when clicking episodes
- [x] Consistent button widths and uniform card heights

### Phase 5: Scheduling ⚠️ ABANDONED
- [x] ~~DO Functions implementation~~ - Reddit blocks cloud IPs
- [x] ~~GitHub Actions workflow~~ - Reddit blocks cloud IPs
- [x] Switched to manual sync approach (works perfectly from local machine)

### Phase 6: Demo Polish 🔄 IN PROGRESS
- [x] Agent prompt optimization with date parsing logic
- [x] Test endpoint for rapid iteration
- [ ] Pre-generate 3-5 sample episodes
- [ ] Verify agent selects recent sources consistently
- [ ] Deploy to App Platform
- [ ] Final UI polish

## Demo Features

### For Live Demo
1. **Pre-generated episodes** (3-5 days worth) - don't rely on live!
2. **Manual "Generate Episode" button** - can trigger live if needed
3. **"Generate Teaser" button** - fast 5-sec test (good for demos)
4. **Visual progress** - show each step: Query → Script → TTS → Done
5. **Show the script** before playing audio
6. **Source links** - click through to original HN/Reddit/ArXiv posts

### Talking Points for Presentation
- "Knowledge Base automatically scrapes 6 AI news sources daily"
- "Gradient agent powered by Anthropic Claude summarizes the news"
- "fal.ai TTS creates human-like audio via DO Serverless"
- "Everything deployed on DigitalOcean App Platform"
- "Click 'Generate' to create a new episode right now..."

## File Structure

```
fal_podcast/
├── app/
│   ├── page.tsx                    # Homepage with episode list
│   ├── layout.tsx                  # Root layout with persistent player
│   ├── globals.css                 # Global styles
│   ├── api/
│   │   ├── generate-episode/
│   │   │   └── route.ts            # Full episode generation API
│   │   ├── generate-teaser/
│   │   │   └── route.ts            # Teaser generation API
│   │   ├── episodes/
│   │   │   └── route.ts            # Fetch episodes from Spaces
│   │   ├── reddit-sync/
│   │   │   └── route.ts            # Manual Reddit sync API
│   │   └── test-agent/
│   │       └── route.ts            # Test agent without full generation
│   └── components/
│       ├── PersistentPlayer.tsx    # Bottom-fixed audio player
│       ├── EpisodeList.tsx         # Episode grid
│       ├── EpisodeCard.tsx         # Individual episode card
│       └── GenerateControls.tsx    # Manual trigger buttons
├── lib/
│   ├── gradient.ts                 # Gradient Agent client + prompts
│   ├── fal.ts                      # fal.ai TTS client (polling)
│   ├── spaces.ts                   # DO Spaces client (AWS SDK v3)
│   ├── types.ts                    # TypeScript types
│   ├── metadata.ts                 # Episode metadata management
│   ├── reddit.ts                   # Reddit API client
│   └── reddit-sync.ts              # Reddit sync orchestration
├── public/                         # Static assets
├── CLAUDE.md                       # This file - project plan & learnings
├── REDDIT_SYNC_SETUP.md            # Reddit sync documentation
├── .env.example                    # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
└── next.config.ts
```

**Note:** `functions/` and `.github/workflows/` directories were removed after abandoning automated scheduling.

## Testing Strategy

1. **Teaser first**: Use 5-sec teaser to test the full pipeline quickly
2. **Check each step**: Gradient response → TTS generation → Spaces upload
3. **Verify metadata**: Ensure episodes.json updates correctly
4. **Test manual triggers**: Both episode and teaser endpoints
5. **Pre-generate demos**: Create 3-5 episodes before the presentation

## Cost Considerations

- **Knowledge Base**: Indexing + storage (minimal for demo)
- **Gradient API**: Per-request pricing (Anthropic model)
- **fal.ai TTS**: Per-character pricing
- **DO Spaces**: Storage (pennies for audio files)
- **App Platform**: $5-12/month for basic tier

## Future Enhancements (Post-Demo)

- RSS feed for podcast apps
- Email notifications for new episodes
- User preferences (topics, length)
- Multi-language support (fal.ai supports it!)
- Transcript generation
- Social media auto-posting
- Optimize KB context with RAG (reduce token usage)
- Implement prompt caching for repeated KB context
- Reddit OAuth API for automated scheduling

---

## Lessons Learned & Troubleshooting

### 1. Reddit API Blocking Cloud IPs ⚠️

**Problem:** Reddit aggressively blocks datacenter/cloud IP addresses, making automated scheduling impossible.

**What We Tried:**
- ✗ DigitalOcean Functions with scheduled triggers - deployed successfully but all requests returned "Blocked"
- ✗ GitHub Actions with cron schedules - same blocking issue
- ✓ Manual sync from local machine - works perfectly!

**Solution:** Accept manual sync workflow. Run before demos:
```bash
curl -X POST http://localhost:3000/api/reddit-sync \
  -H "Authorization: Bearer $SYNC_TOKEN" | jq '.'
```

**Future Options:**
- Reddit Official API with OAuth (requires app approval)
- Proxy service (costs money)
- Keep manual approach (zero compute cost, works for demos)

### 2. Agent Date Parsing Issues

**Problem:** Agent was selecting old sources (September/October papers) when asked for November content.

**Root Cause:** Different source types use different date formats:
- ArXiv: `YYMM.NNNNN` (e.g., `2511.08548` = Nov 2025)
- MarkTechPost: `/YYYY/MM/DD/` in URL
- Reddit: `reddit-{subreddit}-YYYY-MM-DD.md`

**Solution:** Added explicit date parsing instructions to agent prompt in `lib/gradient.ts`:
- Detailed examples of each format
- Clear good/bad examples (✅ 2511.xxxxx vs ❌ 2509.xxxxx)
- 2-step process: (1) find 20 most recent, (2) select 3-5 most newsworthy
- Requirement: sources must be within 2 days of target date

**Testing:** Use `/api/test-agent` to verify source selection without full episode generation.

### 3. Anthropic API Rate Limits

**Problem:** Getting 429 errors (rate limit exceeded) after just 1-2 test runs.

**Root Cause:**
- Rate limit: 30,000 input tokens per minute
- Each request includes: prompt + agent instructions + **entire Knowledge Base**
- With large KB (Hacker News, Reddit, ArXiv, etc.), each request = 15-20k tokens
- Can only make 1-2 requests/minute

**Implications:**
- Space out test runs (wait 1-2 minutes between tests)
- Don't use custom date testing (would multiply API calls)
- For production, consider:
  - RAG optimization (only send relevant chunks)
  - Anthropic prompt caching (cache repeated KB context)
  - Pre-filter documents before sending to agent

**Workaround for Demo:** Pre-generate episodes, use test endpoint sparingly.

### 4. TypeScript Build Errors (Development vs Production)

**Problem:** Code works fine in dev mode but fails in production build.

**Root Cause:**
- Development uses Turbopack with relaxed type checking
- Production build runs full `tsc` with strict checks
- Union types (`AgentResponse | TeaserAgentResponse`) cause ambiguity

**Solution:** Use type assertions when mode is known:
```typescript
const response = await queryAgent(prompt, 'full') as AgentResponse;
// Now TypeScript knows it has topics, sources, etc.
```

**Lesson:** Always test production builds before deploying: `npm run build`

### 5. File Overwriting Behavior

**Question:** What happens if we sync Reddit multiple times same day?

**Answer:** Files automatically overwrite!
- Filename: `reddit-{subreddit}-{date}.md`
- Same filename = overwrites previous version
- This is good - ensures latest data for that day

### 6. Gradient Knowledge Base Context Size

**Discovery:** Gradient KB sends entire knowledge base context with each API request.

**Impact:**
- More comprehensive context for agent
- Higher token costs per request
- Potential rate limiting issues

**More Efficient Approaches:**
1. **RAG (Retrieval Augmented Generation)**: Use vector search to send only top K relevant chunks
2. **Pre-filter by date**: Manually fetch specific documents before querying agent
3. **Prompt caching**: Cache repeated KB context (Anthropic feature)
4. **Two-stage approach**: Use cheap model to identify relevant docs, then query Claude

**For Now:** Accept the tradeoff - comprehensive context is good for demo quality.

---

## Commands Reference

### Development
```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build (tests TypeScript strictness)
npm run start        # Run production build
```

### Reddit Sync
```bash
# Set token
export SYNC_TOKEN=your_token_from_env

# Local sync
curl -X POST http://localhost:3000/api/reddit-sync \
  -H "Authorization: Bearer $SYNC_TOKEN" | jq '.'

# Deployed app
curl -X POST https://your-app.ondigitalocean.app/api/reddit-sync \
  -H "Authorization: Bearer $SYNC_TOKEN" | jq '.'
```

### Testing Agent
```bash
# Test agent response without generating episode
curl -s http://localhost:3000/api/test-agent | jq '.response | {title, sources}'

# Wait 1-2 minutes between runs to avoid rate limits!
```

### Deployment
```bash
# Deploy to DO App Platform
# (Configure via dashboard or doctl)
```

---

## Key Files to Remember

- **`lib/gradient.ts`** - Agent prompts with date parsing logic (lines 115-190)
- **`lib/reddit-sync.ts`** - Subreddit list (add/remove subreddits here)
- **`.env`** - All API keys and tokens (never commit!)
- **`REDDIT_SYNC_SETUP.md`** - Detailed Reddit sync documentation
- **`app/api/test-agent/route.ts`** - Test endpoint for rapid iteration
