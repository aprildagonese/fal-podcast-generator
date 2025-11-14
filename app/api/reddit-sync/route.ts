import { NextResponse } from 'next/server';
import { syncRedditToKB } from '@/lib/reddit-sync';

export async function POST(request: Request) {
  try {
    // Optional: Add authentication to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SYNC_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting Reddit sync...');
    const result = await syncRedditToKB();

    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      synced: result.synced,
      errors: result.errors,
      urls: result.urls,
      message: result.urls.length > 0
        ? `Add these URLs to your Gradient Knowledge Base data sources: ${result.urls.join(', ')}`
        : 'No new documents created',
    });
  } catch (error: any) {
    console.error('Reddit sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Reddit sync endpoint. Use POST to trigger sync.',
    usage: 'curl -X POST http://localhost:3000/api/reddit-sync -H "Authorization: Bearer YOUR_TOKEN"',
  });
}
