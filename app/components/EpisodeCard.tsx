'use client';

import { useState } from 'react';
import { Episode } from '@/lib/types';

interface EpisodeCardProps {
  episode: Episode;
  isLatest?: boolean;
  isPlaying?: boolean;
  onPlay: () => void;
  onPause: () => void;
}

export default function EpisodeCard({ episode, isLatest, isPlaying, onPlay, onPause }: EpisodeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on play button or links
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  return (
    <div
      className={`border rounded-lg p-6 space-y-4 transition-all cursor-pointer hover:shadow-lg ${
        isPlaying
          ? 'border-do-blue ring-2 ring-do-blue bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {isLatest && (
              <span className="inline-block bg-do-blue text-white text-xs font-semibold px-3 py-1 rounded-full">
                Latest Episode
              </span>
            )}
            {isPlaying && (
              <span className="inline-block bg-do-blue text-white text-xs font-semibold px-3 py-1 rounded-full">
                Now Playing
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {episode.title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(episode.createdAt)}
          </p>
        </div>
        <button
          onClick={handlePlayClick}
          className="flex-shrink-0 bg-do-blue hover:bg-blue-600 text-white rounded-full p-3 transition-colors"
          aria-label={isPlaying ? "Pause episode" : "Play episode"}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {isExpanded && (
        <>
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
                      onClick={(e) => e.stopPropagation()}
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
        </>
      )}
    </div>
  );
}
