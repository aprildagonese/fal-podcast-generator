import { NextResponse } from 'next/server';
import { getMetadata, uploadMetadata } from '@/lib/spaces';

export async function POST() {
  try {
    console.log('Fetching current metadata...');
    const metadata = await getMetadata();

    console.log(`Found ${metadata.episodes.length} episodes and ${metadata.teasers.length} teasers`);

    // Filter out episodes without proper titles
    const cleanEpisodes = metadata.episodes.filter((episode: any) => {
      if (!episode.title || episode.title === 'AI News Update') {
        console.log(`Removing episode: ${episode.id} (title: "${episode.title}")`);
        return false;
      }
      return true;
    });

    // Filter out teasers without proper titles
    const cleanTeasers = metadata.teasers.filter((teaser: any) => {
      if (!teaser.title) {
        console.log(`Removing teaser: ${teaser.id} (no title)`);
        return false;
      }
      return true;
    });

    console.log(`After cleanup: ${cleanEpisodes.length} episodes and ${cleanTeasers.length} teasers`);

    const cleanedMetadata = {
      episodes: cleanEpisodes,
      teasers: cleanTeasers,
    };

    console.log('Uploading cleaned metadata...');
    await uploadMetadata(cleanedMetadata);

    return NextResponse.json({
      success: true,
      removed: {
        episodes: metadata.episodes.length - cleanEpisodes.length,
        teasers: metadata.teasers.length - cleanTeasers.length,
      },
      remaining: {
        episodes: cleanEpisodes.length,
        teasers: cleanTeasers.length,
      },
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
