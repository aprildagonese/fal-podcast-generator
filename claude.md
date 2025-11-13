# AI News Podcast Demo - Project Plan

## Overview
Automated AI news podcast system showcasing **DigitalOcean Gradient**, **Anthropic Claude**, and **fal.ai** for a hackathon demo.

## Architecture

### Daily Podcast Generation Flow
```
[DO Functions - Scheduled Daily]
    ↓
1. Query Gradient Agent (Anthropic-powered) with date-specific prompt
    ↓ (Agent auto-accesses Knowledge Base)
2. Agent returns: {title, script, topics[], sources[]}
    ↓
3. Call fal.ai TTS via DO Serverless (with polling)
    ↓
4. Upload audio to DO Spaces
    ↓
5. Save metadata to episodes.json
    ↓
[Next.js App displays new episode]
```

## Components

### 1. Data Collection (DO Knowledge Base)
- **Auto-scraping** configured URLs daily
- **Sources**:
  - Hacker News (https://news.ycombinator.com/)
  - Reddit /r/MachineLearning
  - Reddit /r/LocalLLaMA
  - ArXiv cs.AI recent papers
  - Hugging Face daily papers
  - MarkTechPost AI news

### 2. Content Generation (Gradient + Anthropic)
- **Gradient Agent** configured with Knowledge Base access
- **Model**: Anthropic Claude (via Gradient)
- **Prompts**:
  - **Full Episode** (3 min): "Summarize top AI stories from [DATE]. Generate title, 3-minute podcast script, topics, and source links."
  - **Teaser** (5 sec): "Create a 5-second teaser about the most interesting AI story from [DATE]"

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
  - Episode list with dates
  - Audio player component
  - Show notes with topics and source links
  - Manual triggers for full episode & teaser (demo/testing)
  - Real-time generation progress indicators
  - "Latest episode" highlight

## API Endpoints

### Next.js Routes
- `POST /api/generate-episode` - Generate full 3-min episode
- `POST /api/generate-teaser` - Generate 5-sec teaser
- `GET /api/episodes` - Fetch episode list

### DO Functions
- `daily-podcast-generator` - Scheduled daily at 8am

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Scheduling**: DigitalOcean Functions
- **Storage**: DigitalOcean Spaces (S3-compatible)
- **AI Platform**: DigitalOcean Gradient (Anthropic models)
- **TTS**: fal.ai via DO Serverless Inference
- **Deployment**: DigitalOcean App Platform

## Environment Variables

```bash
# DigitalOcean Spaces
DO_SPACES_ACCESS_KEY_ID=
DO_SPACES_SECRET_ACCESS_KEY=
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=ai-podcast-demo
DO_SPACES_REGION=nyc3

# Gradient AI Platform Agent
AGENT_ENDPOINT=https://your-agent-name.ondigitalocean.app
AGENT_ACCESS_KEY=

# DigitalOcean Inference API (for fal.ai TTS models)
MODEL_ACCESS_KEY=
```

## Implementation Phases

### Phase 1: Project Setup ✓
- [x] Initialize Next.js with TypeScript
- [x] Install dependencies
- [x] Configure TailwindCSS
- [x] Set up project structure

### Phase 2: Core Services
- [ ] Gradient API client
- [ ] fal.ai TTS client (with polling)
- [ ] DO Spaces client
- [ ] Metadata management

### Phase 3: API Routes
- [ ] Generate episode endpoint
- [ ] Generate teaser endpoint
- [ ] Episodes list endpoint

### Phase 4: Frontend
- [ ] Homepage with episode list
- [ ] Audio player component
- [ ] Generation controls (manual triggers)
- [ ] Show notes display
- [ ] Loading states

### Phase 5: DO Functions
- [ ] Daily podcast generator function
- [ ] Deploy to DO Functions platform

### Phase 6: Demo Polish
- [ ] Pre-generate 3-5 sample episodes
- [ ] Visual pipeline indicators
- [ ] Error handling & retry logic
- [ ] Deploy to App Platform

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
│   ├── page.tsx                 # Homepage
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── api/
│   │   ├── generate-episode/
│   │   │   └── route.ts         # Full episode API
│   │   ├── generate-teaser/
│   │   │   └── route.ts         # Teaser API
│   │   └── episodes/
│   │       └── route.ts         # Episodes list API
│   └── components/
│       ├── AudioPlayer.tsx      # Audio player
│       ├── EpisodeList.tsx      # Episode grid/list
│       ├── EpisodeCard.tsx      # Individual episode
│       └── GenerateControls.tsx # Manual trigger buttons
├── lib/
│   ├── gradient.ts              # Gradient API client
│   ├── fal.ts                   # fal.ai TTS client
│   ├── spaces.ts                # DO Spaces client
│   ├── types.ts                 # TypeScript types
│   └── metadata.ts              # Episode metadata management
├── functions/
│   └── daily-podcast/
│       └── handler.py           # Daily scheduled function
├── public/                      # Static assets
├── claude.md                    # This file
├── .env.example
└── package.json
```

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
