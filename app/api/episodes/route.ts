import { NextResponse } from 'next/server';
import { getAllMetadata } from '@/lib/metadata';

export async function GET() {
  try {
    const metadata = await getAllMetadata();

    return NextResponse.json({
      success: true,
      episodes: metadata.episodes || [],
      teasers: metadata.teasers || [],
    });
  } catch (error: any) {
    console.error('Error fetching episodes:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Enable CORS if needed
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
