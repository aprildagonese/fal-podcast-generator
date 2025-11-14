interface RedditPost {
  title: string;
  url: string;
  selftext: string;
  author: string;
  created_utc: number;
  score: number;
  num_comments: number;
  permalink: string;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

export async function fetchSubredditPosts(
  subreddit: string,
  limit: number = 25,
  timeFilter: 'day' | 'week' = 'day'
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?t=${timeFilter}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AINewsPodcast/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.statusText}`);
  }

  const data: RedditResponse = await response.json();
  return data.data.children.map(child => child.data);
}

export function formatPostsAsMarkdown(posts: RedditPost[], subreddit: string): string {
  const date = new Date().toISOString().split('T')[0];

  let markdown = `# Reddit /r/${subreddit} - ${date}\n\n`;
  markdown += `Top posts from the last 24 hours:\n\n`;

  for (const post of posts) {
    const postDate = new Date(post.created_utc * 1000).toISOString();
    markdown += `## ${post.title}\n\n`;
    markdown += `- **Author**: u/${post.author}\n`;
    markdown += `- **Score**: ${post.score} | **Comments**: ${post.num_comments}\n`;
    markdown += `- **URL**: https://reddit.com${post.permalink}\n`;
    markdown += `- **Posted**: ${postDate}\n\n`;

    if (post.selftext && post.selftext.length > 0) {
      markdown += `${post.selftext.substring(0, 500)}${post.selftext.length > 500 ? '...' : ''}\n\n`;
    }

    if (post.url && !post.url.includes('reddit.com')) {
      markdown += `**Link**: ${post.url}\n\n`;
    }

    markdown += `---\n\n`;
  }

  return markdown;
}
