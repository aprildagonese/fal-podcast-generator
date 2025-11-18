import { AgentResponse, TeaserAgentResponse } from './types';

const AGENT_ENDPOINT = process.env.AGENT_ENDPOINT!;
const AGENT_ACCESS_KEY = process.env.AGENT_ACCESS_KEY!;

export async function queryAgent(
  prompt: string,
  mode: 'full' | 'teaser'
): Promise<AgentResponse | TeaserAgentResponse> {
  console.log('Agent Endpoint:', AGENT_ENDPOINT);
  console.log('Access Key exists:', !!AGENT_ACCESS_KEY);
  console.log('Access Key length:', AGENT_ACCESS_KEY?.length);

  const response = await fetch(`${AGENT_ENDPOINT}/api/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AGENT_ACCESS_KEY}`,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4096, // Increase token limit to avoid truncation
      // Agent automatically accesses the Knowledge Base
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gradient API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  // OpenAI-compatible response format
  let content = data.choices?.[0]?.message?.content || '';

  // Try to extract JSON from markdown code fences if present
  const jsonBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (jsonBlockMatch) {
    content = jsonBlockMatch[1].trim();
  } else {
    // Strip markdown code fences from beginning/end if present
    content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  }

  // Try to parse as JSON if the agent returns structured data
  let parsedContent;
  try {
    parsedContent = JSON.parse(content);
  } catch (e) {
    console.log('Agent returned plain text instead of JSON - using as script');
    // If not JSON, treat as plain text script
    parsedContent = { script: content };
  }

  // Parse the agent's response
  if (mode === 'teaser') {
    return {
      title: parsedContent.title || 'AI News Teaser',
      script: parsedContent.script || parsedContent.response || content,
    };
  }

  // For full episodes, expect structured response
  return {
    title: parsedContent.title || 'AI News Update',
    script: parsedContent.script || parsedContent.response || content,
    topics: parsedContent.topics || [],
    sources: parsedContent.sources || [],
  };
}

export function buildPrompt(date: string, mode: 'full' | 'teaser'): string {
  if (mode === 'teaser') {
    return `Based on the knowledge base, create a short, exciting teaser about the MOST IMPORTANT recent AI story.

PRIORITIZATION (in order):
1. First, look for groundbreaking news from ${date} (today)
2. If nothing significant from today, look at yesterday's news
3. Only go back further if needed - always use the most recent date available

Choose the single most impactful story - look for:
- Major model releases or breakthroughs
- Significant research findings
- Important industry announcements
- Game-changing developments

RETURN YOUR RESPONSE AS VALID JSON with this exact structure:
{
  "title": "A short, catchy title (5-10 words)",
  "script": "Your exciting teaser script here - keep it punchy!"
}

IMPORTANT:
- The "title" should be brief and attention-grabbing
- The "script" field contains ONLY the text to be read aloud
- Keep the script short (10-15 seconds max)
- Make it exciting and engaging
- NO labels or markers in the script

Example:
{
  "title": "GPT-5 Outperforms All Models",
  "script": "Breaking: A new 3 billion parameter model just outperformed GPT-4 on reasoning tasks!"
}

Return ONLY valid JSON.`;
  }

  return `Generate a podcast episode about recent AI news.

TODAY'S DATE: ${date}

CRITICAL TWO-STEP PROCESS:

STEP 1 - FIND THE 20 MOST RECENT ITEMS:
Comprehensively scan ALL sources in the knowledge base and identify the 20 most recently published items. Use proper date parsing for each source type:

DATE PARSING BY SOURCE TYPE:
- ArXiv papers: ID format is "YYMM.NNNNN" where YY=year, MM=month
  Example: "2511.08548" = November 2025 (25=2025, 11=November)
  Example: "2510.12345" = October 2025 (TOO OLD if today is Nov 14)
  Example: "2509.67890" = September 2025 (WAY TOO OLD)

- Reddit posts: Filename format "reddit-SubredditName-YYYY-MM-DD.md"
  Example: "reddit-LocalLLaMA-2025-11-14.md" = November 14, 2025 (TODAY - EXCELLENT)
  Example: "reddit-MachineLearning-2025-11-13.md" = November 13, 2025 (YESTERDAY - GOOD)

- Hugging Face papers: Similar to ArXiv, check the paper ID or URL date

ONLY include items from the last 2 days (within 2 days of ${date}).

STEP 2 - SELECT 3-5 MOST NEWSWORTHY:
From those 20 most recent items, select the 3-5 most impactful and newsworthy stories. Prioritize:
- Major model releases or breakthroughs
- Significant research findings with real-world impact
- Important industry announcements
- Game-changing technical developments
- Active community discussions with high engagement

Include a MIX of source types:
- Research papers (ArXiv, Hugging Face)
- Community discussions (Reddit)

RETURN YOUR RESPONSE AS VALID, COMPLETE JSON with this exact structure:
{
  "title": "A catchy episode title",
  "script": "ONLY the spoken narration - no labels or markers",
  "topics": ["Topic 1", "Topic 2", "Topic 3"],
  "sources": [{"type": "research", "title": "Short Title", "url": "https://..."}]
}

IMPORTANT: Keep the response concise to avoid truncation. Limit script to 2-3 minutes of content. Use short source titles.

DATE VERIFICATION:
Before including any source, verify its date is within the last 2 days of ${date}. If you're including a paper from ArXiv ID "2509.XXXXX" (September) when today is November, that's WRONG - find more recent content.

CRITICAL - THE SCRIPT FIELD:
- Contains ONLY the text to be read aloud by text-to-speech
- NO labels like "intro:", "script:", "story 1:", "title:", "topics:", "sources:"
- NO structure markers or metadata
- Just a continuous, natural-sounding narrative
- For EACH story include:
  * What happened (the news itself)
  * Why it matters (context and implications)
  * What makes this significant for the AI community
- Keep intro/outro brief - focus on the stories!

EXAMPLE SCRIPT (this is what goes in the "script" field):
"Welcome to AI News Update. This week brings three major developments in artificial intelligence. First, OpenAI has released a new reasoning model showing significant improvements in complex problem-solving. This matters because it represents a shift toward more deliberate AI thinking. The AI community is particularly excited because this could unlock new capabilities in scientific research and mathematical proof. Second, researchers at Stanford..."

IMPORTANT: If using news from a day or two ago (not ${date}), don't mention exact dates in the script. Say "this week in AI" or "recent developments".

EXAMPLE OF GOOD SOURCE SELECTION (if today is 2025-11-14):
✅ ArXiv paper "2511.08548" (November 2025 - GOOD, very recent)
✅ Hugging Face paper from November 2025 (Recent - GOOD)
✅ Reddit "reddit-LocalLLaMA-2025-11-14.md" (Today - EXCELLENT)
❌ ArXiv paper "2510.04399" (October 2025 - TOO OLD)
❌ ArXiv paper "2509.21825" (September 2025 - WAY TOO OLD)

Return ONLY valid JSON - be selective and engaging!`;
}
