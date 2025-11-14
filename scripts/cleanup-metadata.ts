import { getMetadata, uploadMetadata } from '../lib/spaces';

async function cleanupMetadata() {
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

  console.log(`\nAfter cleanup: ${cleanEpisodes.length} episodes and ${cleanTeasers.length} teasers`);

  const cleanedMetadata = {
    episodes: cleanEpisodes,
    teasers: cleanTeasers,
  };

  console.log('\nUploading cleaned metadata...');
  await uploadMetadata(cleanedMetadata);

  console.log('✅ Cleanup complete!');
}

cleanupMetadata().catch(console.error);
