/**
 * DigitalOcean Function - Daily Reddit Sync
 *
 * Triggers the Reddit sync endpoint daily at 12AM UTC
 *
 * Deploy with:
 * doctl serverless deploy functions/reddit-daily-sync --remote-build
 */

async function main(args) {
  const APP_URL = args.APP_URL || process.env.APP_URL;
  const SYNC_TOKEN = args.SYNC_TOKEN || process.env.SYNC_TOKEN;

  if (!APP_URL) {
    return {
      statusCode: 400,
      body: { error: 'APP_URL environment variable required' }
    };
  }

  console.log(`Triggering Reddit sync at ${new Date().toISOString()}`);

  try {
    const response = await fetch(`${APP_URL}/api/reddit-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SYNC_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('Sync result:', data);

    return {
      statusCode: response.status,
      body: data,
    };
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      statusCode: 500,
      body: { error: error.message }
    };
  }
}

exports.main = main;
