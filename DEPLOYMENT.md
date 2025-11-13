# Deployment Guide

Complete guide to deploying the AI News Podcast app to DigitalOcean.

## Prerequisites

- [ ] DigitalOcean account
- [ ] GitHub account (or GitLab/Bitbucket)
- [ ] Gradient API key (provides access to both Anthropic and fal.ai models)
- [ ] `doctl` CLI installed

## Step-by-Step Deployment

### 1. Create DO Spaces Bucket

1. Go to **Spaces** in DO control panel
2. Click **Create Space**
3. Choose a region (e.g., NYC3)
4. Name it: `ai-podcast-demo` (or your choice)
5. Set to **Public** (for audio files)
6. Click **Create**

**Generate API Keys:**
1. Click **Manage Keys** (under API)
2. Generate new **Spaces access keys**
3. Save the Key and Secret (you won't see them again!)

### 2. Set Up Knowledge Base on Gradient

1. Go to [Gradient Platform](https://gradient.ai)
2. Create a new **Knowledge Base**
3. Name it: "AI News Sources"
4. Add URLs to scrape:
   ```
   https://news.ycombinator.com/
   https://www.reddit.com/r/MachineLearning/
   https://www.reddit.com/r/LocalLLaMA/
   https://arxiv.org/list/cs.AI/recent
   https://huggingface.co/papers
   https://www.marktechpost.com/
   ```
5. Set scraping schedule: **Daily at 7:00 AM UTC**
6. Click **Save**

### 3. Create Gradient Agent

1. In Gradient, create a new **Agent**
2. Name it: "AI News Podcast Agent"
3. Select model: **Anthropic Claude** (Sonnet or Opus)
4. Link it to your Knowledge Base created above
5. Test with a simple query: "Summarize recent AI news"
6. Copy the **Agent ID** (you'll need this)

### 4. Push Code to GitHub

```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: AI News Podcast"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ai-podcast-demo.git
git branch -M main
git push -u origin main
```

### 5. Deploy to App Platform

1. Go to **App Platform** in DO control panel
2. Click **Create App**
3. Choose **GitHub** as source
4. Select your repository
5. Choose branch: `main`
6. Configure:
   - **Resource Type**: Web Service
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: 3000
   - **Environment**: Node.js

7. **Add Environment Variables** (click "Edit" next to "Environment Variables"):
   ```
   DO_SPACES_ACCESS_KEY_ID=your_access_key_id_here
   DO_SPACES_SECRET_ACCESS_KEY=your_secret_access_key_here
   DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
   DO_SPACES_BUCKET=ai-podcast-demo
   DO_SPACES_REGION=nyc3
   AGENT_ENDPOINT=https://your-agent-name.ondigitalocean.app
   AGENT_ACCESS_KEY=your_endpoint_access_key_here
   MODEL_ACCESS_KEY=your_model_access_key_here
   ```

   Note: Get your agent endpoint URL and access key from the Gradient agent's Settings → Endpoint Access Keys.

8. Choose plan: **Basic ($5/month)** is fine for demo
9. Click **Create Resources**
10. Wait for deployment (~5 minutes)
11. Copy your app URL: `https://ai-podcast-demo-xxxxx.ondigitalocean.app`

### 6. Test the Deployment

1. Visit your App Platform URL
2. Click **"Generate Teaser (5 sec)"**
3. Wait ~30-60 seconds
4. Audio should appear and play!

If it works, try **"Generate Full Episode"**

### 7. Deploy Daily Function (Optional)

```bash
# Install doctl if you haven't
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init

# Create namespace
doctl serverless namespaces create ai-podcast

# Connect to it
doctl serverless connect

# Navigate to functions directory
cd functions

# Create .env file
echo "APP_URL=https://your-app.ondigitalocean.app" > .env

# Deploy!
doctl serverless deploy daily-podcast

# Verify
doctl serverless functions list
```

The function will now run daily at 8:00 AM UTC.

**Manual test:**
```bash
doctl serverless functions invoke daily-podcast/daily-podcast
```

### 8. Pre-Generate Demo Episodes

Before your presentation, generate 3-5 episodes manually:

1. Visit your app
2. Click "Generate Full Episode"
3. Wait for completion
4. Repeat 2-3 more times (you can do this daily leading up to the hackathon)

This ensures you have content to show even if something goes wrong during the live demo!

## Verification Checklist

- [ ] App Platform deployed successfully
- [ ] Environment variables set correctly
- [ ] Spaces bucket created and accessible
- [ ] Knowledge Base configured and scraping
- [ ] Gradient Agent created and linked to KB
- [ ] Can generate teaser successfully
- [ ] Can generate full episode successfully
- [ ] Audio plays in browser
- [ ] Episodes list displays correctly
- [ ] Sources link to original content
- [ ] DO Function deployed (optional)
- [ ] Pre-generated 3-5 demo episodes

## Monitoring & Logs

### App Platform Logs

1. Go to your app in App Platform
2. Click **"Runtime Logs"** tab
3. Filter by time or search for errors

### Function Logs

```bash
# View recent activations
doctl serverless activations list

# Follow logs in real-time
doctl serverless activations logs --follow

# Get specific activation
doctl serverless activations get ACTIVATION_ID
```

### Spaces Browser

1. Go to Spaces in DO control panel
2. Click your bucket
3. Browse files:
   - `audio/` folder: MP3 files
   - `episodes.json`: Metadata

## Troubleshooting

### Build Fails on App Platform

**Error**: `Module not found`
- Check `package.json` has all dependencies
- Ensure `next` is in `dependencies` not `devDependencies`

**Error**: `TypeScript error`
- Run `npm run build` locally first
- Fix any type errors before pushing

### Episode Generation Fails

**Check Gradient Agent:**
```bash
curl -X POST https://api.gradient.ai/agents/YOUR_AGENT_ID/query \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"prompt": "test"}'
```

**Check fal.ai:**
```bash
curl -X POST https://api.fal.ai/models/fal-ai/elevenlabs/tts/multilingual-v2 \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"text": "test", "voice": "Rachel"}'
```

**Check Spaces:**
- Ensure bucket is public
- Verify keys have write permissions
- Check CORS settings if needed

### Audio Won't Play

1. Check audio URL is publicly accessible (paste in browser)
2. Verify Spaces bucket is public
3. Check browser console for CORS errors
4. Try different browser

## Updating the App

```bash
# Make changes locally
git add .
git commit -m "Update: description"
git push

# App Platform will auto-deploy!
```

## Scaling Considerations

For production beyond demo:

- **App Platform**: Upgrade to Pro ($12/mo) for more resources
- **Spaces**: CDN bandwidth included
- **Functions**: Monitor activation count (free tier = 400k GB-seconds/month)
- **Database**: Add PostgreSQL if you need advanced queries
- **Caching**: Add Redis for frequently accessed data

## Cost Breakdown

**Monthly costs for daily podcast:**

- App Platform Basic: $5/mo
- Spaces: $5/mo (250GB storage + 1TB transfer included)
- Functions: Free tier (well within limits)
- Gradient API: ~$3-10/mo (depending on usage)
- fal.ai TTS: ~$1-5/mo (depending on episode length)

**Total: ~$14-25/month**

## Support

If you encounter issues:

1. Check App Platform logs
2. Review [claude.md](./claude.md) for architecture details
3. Test individual components (Gradient, fal.ai, Spaces)
4. Verify all environment variables
5. Try generating a teaser (faster, easier to debug)

## Next Steps After Demo

Ideas to extend the project:

- [ ] Add RSS feed for podcast apps
- [ ] Email notifications for new episodes
- [ ] User voting on topics
- [ ] Multi-language support
- [ ] Transcript display alongside audio
- [ ] Social media auto-posting
- [ ] Custom Knowledge Base content (let users add sources)
- [ ] Analytics dashboard

---

Good luck with your hackathon! 🚀
