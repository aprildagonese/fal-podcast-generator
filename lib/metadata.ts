import { Episode, Teaser, EpisodesMetadata } from './types';
import { getMetadata, uploadMetadata } from './spaces';

export async function addEpisode(episode: Episode): Promise<void> {
  const metadata = await getMetadata();

  // Add new episode (avoiding duplicates)
  const existingIndex = metadata.episodes.findIndex((e: Episode) => e.id === episode.id);

  if (existingIndex >= 0) {
    metadata.episodes[existingIndex] = episode;
  } else {
    metadata.episodes.push(episode);
  }

  // Sort by date (newest first)
  metadata.episodes.sort((a: Episode, b: Episode) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  await uploadMetadata(metadata);
}

export async function addTeaser(teaser: Teaser): Promise<void> {
  const metadata = await getMetadata();

  // Add new teaser
  const existingIndex = metadata.teasers.findIndex((t: Teaser) => t.id === teaser.id);

  if (existingIndex >= 0) {
    metadata.teasers[existingIndex] = teaser;
  } else {
    metadata.teasers.push(teaser);
  }

  // Sort by date (newest first)
  metadata.teasers.sort((a: Teaser, b: Teaser) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  await uploadMetadata(metadata);
}

export async function getEpisodes(): Promise<Episode[]> {
  const metadata = await getMetadata();
  return metadata.episodes || [];
}

export async function getTeasers(): Promise<Teaser[]> {
  const metadata = await getMetadata();
  return metadata.teasers || [];
}

export async function getAllMetadata(): Promise<EpisodesMetadata> {
  return await getMetadata();
}
