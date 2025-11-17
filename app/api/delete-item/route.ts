import { NextResponse } from 'next/server';
import { getMetadata, uploadMetadata } from '@/lib/spaces';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type'); // 'episode' or 'teaser'
    const password = searchParams.get('password');

    // Secret password check
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing id or type' },
        { status: 400 }
      );
    }

    const metadata = await getMetadata();

    if (type === 'episode') {
      metadata.episodes = metadata.episodes.filter((e: any) => e.id !== id);
    } else if (type === 'teaser') {
      metadata.teasers = metadata.teasers.filter((t: any) => t.id !== id);
    }

    await uploadMetadata(metadata);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
