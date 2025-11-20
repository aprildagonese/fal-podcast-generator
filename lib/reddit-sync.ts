import { fetchSubredditPosts, formatPostsAsMarkdown } from './reddit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const SUBREDDITS = [
  'MachineLearning',
  'LocalLLaMA',
  'artificial',
];

const s3Client = new S3Client({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`,
  region: process.env.DO_SPACES_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false,
});

const BUCKET = process.env.DO_SPACES_BUCKET!;

// Helper to delay between requests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function syncRedditToKB(): Promise<{
  success: boolean;
  synced: string[];
  errors: string[];
  urls: string[];
}> {
  const synced: string[] = [];
  const errors: string[] = [];
  const urls: string[] = [];

  for (let i = 0; i < SUBREDDITS.length; i++) {
    const subreddit = SUBREDDITS[i];

    // Add delay between requests (except for first one)
    if (i > 0) {
      console.log('Waiting 2 seconds before next request...');
      await sleep(2000);
    }
    try {
      console.log(`Fetching posts from r/${subreddit}...`);
      const posts = await fetchSubredditPosts(subreddit, 25, 'day');

      console.log(`Found ${posts.length} posts from r/${subreddit}`);

      if (posts.length === 0) {
        console.log(`⚠️  No posts found for r/${subreddit} in the last 24 hours`);
        continue;
      }

      const markdown = formatPostsAsMarkdown(posts, subreddit);

      const date = new Date().toISOString().split('T')[0];
      const filename = `reddit-${subreddit}-${date}.md`;
      const key = `reddit-sync/${filename}`;

      console.log(`Uploading to DO Spaces: ${key}`);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: markdown,
          ACL: 'public-read',
          ContentType: 'text/markdown',
        })
      );

      const url = `https://${BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`;
      console.log(`✅ Synced r/${subreddit} to ${url}`);

      synced.push(subreddit);
      urls.push(url);
    } catch (error: any) {
      console.error(`❌ Failed to sync r/${subreddit}:`, error.message);
      errors.push(`${subreddit}: ${error.message}`);
    }
  }

  return {
    success: errors.length === 0,
    synced,
    errors,
    urls,
  };
}
