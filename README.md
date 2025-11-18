# AI News Podcast Generator

Automated daily AI news podcast powered by **DigitalOcean Gradient** (Anthropic Claude), **fal.ai TTS**, and deployed on **DigitalOcean App Platform**.

![Demo Architecture](https://via.placeholder.com/800x400.png?text=AI+Podcast+Demo+Architecture)

## Features

- 🤖 **AI-powered content generation** using Anthropic Claude Sonnet 4.5 via DO Gradient
- 📰 **Automatic news aggregation** from ArXiv, Hugging Face
- 📱 **Manual Reddit sync** from r/MachineLearning, r/LocalLLaMA, r/artificial
- 🎙️ **Natural-sounding TTS** using fal.ai's ElevenLabs Multilingual v2
- ☁️ **Fully hosted on DigitalOcean** (App Platform + Spaces)
- ⚡ **Smart generation controls** - buttons gray out when content exists for today
- 🎵 **Persistent audio player** with playback speed controls (0.5x - 2x, default 1.25x)
- 🔍 **Date-aware source selection** - agent intelligently parses dates across different formats

## Architecture

```
Manual Reddit Sync (local) → DO Spaces (reddit-sync/)
                                  ↓
Knowledge Base (DO) ← Crawls at midnight UTC
  ↓ (auto-scrapes ArXiv, Hugging Face, Reddit sync)
  ↓
Gradient Agent (Anthropic Claude Sonnet 4.5)
  ↓ (date-aware 2-step selection)
Script Generator
  ↓
fal.ai TTS (ElevenLabs v2)
  ↓
DO Spaces (audio + metadata)
  ↓
Next.js 16 App (App Platform)
```

**Note:** Reddit sync is manual because Reddit blocks cloud/datacenter IPs. Simple curl command syncs from local machine.

## Prerequisites

- DigitalOcean account
- Gradient API access (with Anthropic model)
- fal.ai API key
- Node.js 18+ and npm

## Quick Start

### 1. Clone and Install

```bash
npm install
```

### 2. Set up Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DO_SPACES_ACCESS_KEY_ID` - Your DO Spaces access key ID
- `DO_SPACES_SECRET_ACCESS_KEY` - Your DO Spaces secret access key
- `DO_SPACES_BUCKET` - Bucket name (create one first!)
- `DO_SPACES_ENDPOINT` - e.g., nyc3.digitaloceanspaces.com
- `DO_SPACES_REGION` - e.g., nyc3
- `AGENT_ENDPOINT` - Your Gradient agent endpoint URL (e.g., https://your-agent.ondigitalocean.app)
- `AGENT_ACCESS_KEY` - Endpoint access key from agent Settings
- `MODEL_ACCESS_KEY` - Model access key for fal.ai TTS (from DO Inference API)
- `SYNC_TOKEN` - Random secure token for Reddit sync endpoint

### 3. Configure Knowledge Base

In the DigitalOcean Gradient platform:

1. Create a new Knowledge Base
2. Add these URLs to auto-scrape:
   - `https://arxiv.org/list/cs.AI/recent`
   - `https://huggingface.co/papers`
   - `https://YOUR-BUCKET.YOUR-REGION.digitaloceanspaces.com/reddit-sync/` (for Reddit posts)
3. Set scraping schedule to daily (midnight UTC recommended)
4. Create an Agent and link it to this Knowledge Base
5. Copy the Agent endpoint URL and access key to your `.env` file

**Note:** Don't add Reddit URLs directly - they'll be blocked. Instead, use the manual Reddit sync to populate the `reddit-sync/` folder in your Spaces bucket, and the KB will crawl that.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Test Generation

Click "Generate Teaser (5 sec)" to quickly test the full pipeline:
- Queries the Knowledge Base via Gradient Agent
- Generates script with Anthropic Claude
- Creates audio via fal.ai TTS
- Uploads to DO Spaces
- Displays in the UI

## Deployment

### Deploy to DigitalOcean App Platform

1. **Create a new App** in the DO control panel
2. **Connect your GitHub repo**
3. **Configure the app**:
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Environment Variables: Add all from `.env`
4. **Deploy!**

App Platform will automatically:
- Build your Next.js app
- Set up HTTPS
- Provide a URL like `your-app.ondigitalocean.app`

### Manual Reddit Sync

Before generating episodes (or before your demo), sync Reddit posts:

```bash
export SYNC_TOKEN=your_token_from_env_file

# Local development
curl -X POST http://localhost:3000/api/reddit-sync \
  -H "Authorization: Bearer $SYNC_TOKEN" | jq '.'

# Production
curl -X POST https://your-app.ondigitalocean.app/api/reddit-sync \
  -H "Authorization: Bearer $SYNC_TOKEN" | jq '.'
```

This fetches top 25 posts from r/MachineLearning, r/LocalLLaMA, and r/artificial (last 24h) and uploads them to DO Spaces. Your Gradient KB will crawl them at midnight UTC.

See [REDDIT_SYNC_SETUP.md](./REDDIT_SYNC_SETUP.md) for detailed instructions.

## Project Structure

```
fal_podcast/
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── generate-episode/   # Full episode generation
│   │   ├── generate-teaser/    # Teaser generation
│   │   ├── episodes/           # Fetch episodes list
│   │   ├── reddit-sync/        # Manual Reddit sync
│   │   └── test-agent/         # Test agent responses
│   ├── components/             # React components
│   │   ├── PersistentPlayer.tsx # Audio player with speed controls
│   │   ├── EpisodeCard.tsx      # Episode display with play/pause
│   │   ├── GenerateControls.tsx # Smart generation buttons
│   │   └── PasswordModal.tsx    # Secure modal input
│   ├── page.tsx                # Homepage
│   └── layout.tsx              # Root layout
├── lib/
│   ├── gradient.ts             # Gradient Agent client + prompts
│   ├── fal.ts                  # fal.ai TTS client (with polling)
│   ├── spaces.ts               # DO Spaces client (AWS SDK v3)
│   ├── metadata.ts             # Episode metadata management
│   ├── reddit.ts               # Reddit API client
│   ├── reddit-sync.ts          # Reddit sync orchestration
│   └── types.ts                # TypeScript types
├── CLAUDE.md                   # Full project plan & learnings
├── REDDIT_SYNC_SETUP.md        # Reddit sync documentation
└── README.md                   # This file
```

## How It Works

### Full Episode Generation (3 minutes)

1. **Query Agent**: Prompt asks for "today's top AI stories"
2. **Agent Response**: Returns structured data (title, script, topics, sources)
3. **TTS Generation**: Script sent to fal.ai → audio URL returned (via polling)
4. **Download & Upload**: Audio downloaded and uploaded to DO Spaces
5. **Metadata**: Episode info saved to `episodes.json` in Spaces
6. **UI Update**: New episode appears on homepage

### Teaser Generation (5 seconds)

Same process, but:
- Simpler prompt: "most interesting story"
- Shorter script (~1 sentence)
- Faster for testing

## API Endpoints

### `POST /api/generate-episode`

Generates a full 3-minute podcast episode.

**Response:**
```json
{
  "success": true,
  "episode": {
    "id": "2025-01-12",
    "title": "GPT-5 Rumors and Small Model Revolution",
    "audioUrl": "https://...",
    "duration": 180,
    "topics": [...],
    "sources": [...]
  }
}
```

### `POST /api/generate-teaser`

Generates a 5-second teaser.

**Response:**
```json
{
  "success": true,
  "teaser": {
    "id": "2025-01-12-1234567890",
    "audioUrl": "https://...",
    "duration": 5
  },
  "script": "Breaking: A new 3B model just outperformed GPT-4!"
}
```

### `GET /api/episodes`

Returns all episodes and teasers.

**Response:**
```json
{
  "success": true,
  "episodes": [...],
  "teasers": [...]
}
```

## Demo Tips

For your hackathon presentation:

1. **Pre-generate 3-5 episodes** before the talk
2. Use **"Generate Teaser"** for live demo (faster, safer)
3. Show the **pipeline steps** in the UI status messages
4. **Click through to sources** to show real data
5. Emphasize the **three platforms working together**:
   - DO Knowledge Base → Gradient Agent → fal.ai TTS

## Customization

### Change TTS Voice

Edit `lib/fal.ts`:
```typescript
const DEFAULT_VOICE = 'Bella'; // or 'Domi', 'Josh', etc.
```

### Modify Prompts

Edit `lib/gradient.ts` → `buildPrompt()` function

## Troubleshooting

### "No episodes yet" message

- Check if Spaces bucket exists and is publicly readable
- Verify environment variables are set correctly
- Check browser console for errors

### Episode generation fails

- Verify Gradient agent has Knowledge Base access
- Check fal.ai API key and quota
- Look at server logs: `npm run dev` or App Platform logs

### Audio won't play

- Ensure Spaces bucket has CORS configured
- Check audio URL is publicly accessible
- Verify browser supports MP3 playback

## Cost Estimate

Per episode generated:
- Knowledge Base indexing: ~$0.01
- Gradient API (Anthropic): ~$0.05-0.10
- fal.ai TTS: ~$0.02-0.05
- DO Spaces: ~$0.001
- App Platform: $5-12/month (flat rate)

**Total: ~$5-15/month** (assuming daily generation)

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript, TailwindCSS
- **AI/ML**: DigitalOcean Gradient, Anthropic Claude, fal.ai TTS
- **Infrastructure**: DigitalOcean App Platform, Spaces
- **Storage**: DO Spaces (S3-compatible object storage)

## License

MIT

## Support

For issues or questions:
- Check [CLAUDE.md](./CLAUDE.md) for detailed architecture and project plan
- Review [REDDIT_SYNC_SETUP.md](./REDDIT_SYNC_SETUP.md) for Reddit sync instructions
- Open an issue on GitHub

---

Built with ❤️ for Hack FLUX: Beyond One
