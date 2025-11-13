'use client';

import { Episode } from '@/lib/types';

interface EpisodeCardProps {
  episode: Episode;
  isLatest?: boolean;
  isPlaying?: boolean;
  onPlay: () => void;
}

export default function EpisodeCard({ episode, isLatest, isPlaying, onPlay }: EpisodeCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div
      className={`border rounded-lg p-6 space-y-4 transition-all cursor-pointer hover:shadow-lg ${
        isPlaying
          ? 'border-do-blue ring-2 ring-do-blue bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={onPlay}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isLatest && (
            <span className="inline-block bg-do-blue text-white text-xs font-semibold px-3 py-1 rounded-full mb-2">
              Latest Episode
            </span>
          )}
          {isPlaying && (
            <span className="inline-block bg-do-blue text-white text-xs font-semibold px-3 py-1 rounded-full mb-2 ml-2">
              Now Playing
            </span>
          )}
        </div>
        <button
          onClick={onPlay}
          className="flex-shrink-0 bg-do-blue hover:bg-blue-600 text-white rounded-full p-3 transition-colors"
          aria-label="Play episode"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {episode.title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(episode.createdAt)} • {episode.duration} seconds
        </p>
      </div>

      {episode.topics && episode.topics.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Topics Covered:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {episode.topics.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
        </div>
      )}

      {episode.sources && episode.sources.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Sources:
          </h3>
          <ul className="space-y-2">
            {episode.sources.map((source, index) => (
              <li key={index}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-do-blue hover:underline flex items-center gap-2"
                >
                  <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    {source.type}
                  </span>
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
