# AI News Podcast Generator

Automated daily AI news podcast powered by **DigitalOcean Gradient** (Anthropic Claude), **fal.ai TTS**, and deployed on **DigitalOcean App Platform**.

![Demo Architecture](https://via.placeholder.com/800x400.png?text=AI+Podcast+Demo+Architecture)

## Features

- 🤖 **AI-powered content generation** using Anthropic Claude via DO Gradient
- 📰 **Automatic news aggregation** from Hacker News, Reddit, ArXiv, and more
- 🎙️ **Natural-sounding TTS** using fal.ai's ElevenLabs integration
- ☁️ **Fully hosted on DigitalOcean** (App Platform + Spaces + Functions)
- ⚡ **Manual triggers** for instant episode/teaser generation
- 📅 **Daily automation** via scheduled DO Functions

## Architecture

```
Knowledge Base (DO)
  ↓ (auto-scrapes daily)
Gradient Agent (Anthropic)
  ↓
Script Generator
  ↓
fal.ai TTS
  ↓
DO Spaces (storage)
  ↓
Next.js App (App Platform)
```

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
- `AGENT_ENDPOINT` - Your Gradient agent endpoint URL (e.g., https://your-agent.ondigitalocean.app)
- `AGENT_ACCESS_KEY` - Endpoint access key from agent Settings
- `MODEL_ACCESS_KEY` - Model access key for fal.ai TTS (from DO console)

### 3. Configure Knowledge Base

In the DigitalOcean Gradient platform:

1. Create a new Knowledge Base
2. Add these URLs to scrape:
   - `https://news.ycombinator.com/`
   - `https://www.reddit.com/r/MachineLearning/`
   - `https://www.reddit.com/r/LocalLLaMA/`
   - `https://arxiv.org/list/cs.AI/recent`
   - `https://huggingface.co/papers`
   - `https://www.marktechpost.com/`
3. Set scraping schedule to daily
4. Create an Agent and link it to this Knowledge Base
5. Copy the Agent ID to your `.env` file

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

### Deploy Daily Function

```bash
cd functions
doctl serverless deploy daily-podcast
```

See [functions/README.md](./functions/README.md) for detailed instructions.

## Project Structure

```
fal_podcast/
├── app/
│   ├── api/                    # API routes
│   │   ├── generate-episode/   # Full 3-min episode
│   │   ├── generate-teaser/    # 5-sec teaser
│   │   └── episodes/           # List episodes
│   ├── components/             # React components
│   │   ├── AudioPlayer.tsx
│   │   ├── EpisodeCard.tsx
│   │   └── GenerateControls.tsx
│   ├── page.tsx                # Homepage
│   └── layout.tsx
├── lib/
│   ├── gradient.ts             # Gradient API client
│   ├── fal.ts                  # fal.ai TTS client
│   ├── spaces.ts               # DO Spaces client
│   ├── metadata.ts             # Episode metadata
│   └── types.ts                # TypeScript types
├── functions/
│   └── daily-podcast/          # DO Function for daily automation
├── claude.md                   # Full project plan
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

### Daily Automation

DO Function runs at 8 AM UTC daily:
- Calls `/api/generate-episode`
- New episode ready every morning!

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

### Adjust Schedule

Edit `functions/daily-podcast/project.yml`:
```yaml
schedule: '0 9 * * *'  # 9 AM instead of 8 AM
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

Per day:
- Knowledge Base indexing: ~$0.01
- Gradient API (Anthropic): ~$0.05-0.10
- fal.ai TTS: ~$0.02-0.05
- DO Spaces: ~$0.001
- App Platform: $5-12/month (flat rate)
- DO Functions: Free tier

**Total: ~$5-15/month** for daily podcast automation

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **AI/ML**: DigitalOcean Gradient, Anthropic Claude, fal.ai TTS
- **Infrastructure**: DigitalOcean App Platform, Spaces, Functions
- **Storage**: DO Spaces (S3-compatible object storage)

## License

MIT

## Support

For issues or questions:
- Check [claude.md](./claude.md) for detailed architecture
- Review [functions/README.md](./functions/README.md) for DO Functions setup
- Open an issue on GitHub

---

Built with ❤️ for the DigitalOcean Hackathon
