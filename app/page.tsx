'use client';

import { useEffect, useState, useCallback } from 'react';
import { Episode, Teaser } from '@/lib/types';
import EpisodeCard from './components/EpisodeCard';
import GenerateControls from './components/GenerateControls';
import PersistentPlayer from './components/PersistentPlayer';
import PasswordModal from './components/PasswordModal';

export default function Home() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [teasers, setTeasers] = useState<Teaser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentItem, setCurrentItem] = useState<Episode | Teaser | null>(null);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [showAllTeasers, setShowAllTeasers] = useState(false);
  const [playerIsPlaying, setPlayerIsPlaying] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [lastShiftPress, setLastShiftPress] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const fetchEpisodes = async () => {
    try {
      const response = await fetch('/api/episodes');
      const data = await response.json();

      if (data.success) {
        setEpisodes(data.episodes || []);
        setTeasers(data.teasers || []);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEpisodes();
  }, []);

  // Secret admin mode trigger: Press D while holding Shift twice quickly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'D') {
        const now = Date.now();
        if (now - lastShiftPress < 500) {
          // Double press detected!
          if (adminMode) {
            // Exit admin mode
            setAdminMode(false);
            sessionStorage.removeItem('adminPassword');
            alert('👋 Admin mode deactivated.');
          } else {
            // Show password modal
            setShowPasswordModal(true);
          }
        }
        setLastShiftPress(now);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lastShiftPress, adminMode]);

  const handlePasswordSubmit = async (password: string) => {
    setShowPasswordModal(false);

    try {
      // Verify password with API
      const response = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setAdminMode(true);
        sessionStorage.setItem('adminPassword', password);
        alert('🎉 Admin mode activated! Delete buttons now visible. Press Shift+D+D again to exit.');
      } else {
        alert('❌ Invalid password');
      }
    } catch (error) {
      alert('❌ Error verifying password');
    }
  };

  const handleGenerated = () => {
    // Refresh episodes list
    fetchEpisodes();
  };

  const handlePlayingChange = useCallback((isPlaying: boolean) => {
    setPlayerIsPlaying(isPlaying);
  }, []);

  const handleDelete = async (id: string, type: 'episode' | 'teaser') => {
    const password = sessionStorage.getItem('adminPassword');
    if (!password) return;

    if (!confirm(`Delete this ${type}?`)) return;

    try {
      const response = await fetch(
        `/api/delete-item?id=${encodeURIComponent(id)}&type=${type}&password=${encodeURIComponent(password)}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${type === 'episode' ? 'Episode' : 'Teaser'} deleted!`);
        fetchEpisodes();
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Check if there's an episode or teaser for today
  const today = new Date().toISOString().split('T')[0];
  const hasEpisodeToday = episodes.some(ep => ep.id.startsWith(today));
  const hasTeaserToday = teasers.some(teaser => teaser.id.startsWith(today));

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pb-32">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI News Podcast
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Daily AI updates powered by DigitalOcean, Anthropic & fal.ai
          </p>
          <div className="flex justify-center items-center gap-6 text-sm text-gray-500 dark:text-gray-500 flex-wrap">
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.worldvectorlogo.com/logos/anthropic-1.svg"
                alt="Anthropic"
                className="w-6 h-6"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span>Claude Sonnet 4.5 via DO Gradient</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <img
                src="https://fal.ai/favicon.ico"
                alt="fal.ai"
                className="w-5 h-5"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span>fal.ai TTS via DO Gradient</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <img
                src="https://w7.pngwing.com/pngs/410/265/png-transparent-digitalocean-icon-hd-logo-thumbnail.png"
                alt="DigitalOcean"
                className="w-6 h-6"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span>DigitalOcean Gradient</span>
            </div>
          </div>
        </header>

        {/* Generate Controls */}
        <div className="mb-12">
          <GenerateControls
            onGenerated={handleGenerated}
            hasEpisodes={hasEpisodeToday}
            hasTeasers={hasTeaserToday}
          />
        </div>

        {/* Episodes List */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Episodes
          </h2>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-do-blue"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading episodes...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
              <p className="text-yellow-800 dark:text-yellow-400">
                {error}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
                No episodes yet. Generate your first one above!
              </p>
            </div>
          )}

          {!loading && !error && episodes.length === 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                No episodes yet
              </p>
              <p className="text-gray-500 dark:text-gray-500">
                Click "Generate Full Episode" above to create your first AI news podcast!
              </p>
            </div>
          )}

          {!loading && episodes.length > 0 && (
            <>
              <div className="space-y-6">
                {(showAllEpisodes ? episodes : episodes.slice(0, 5)).map((episode, index) => (
                  <EpisodeCard
                    key={episode.id}
                    episode={episode}
                    isLatest={index === 0}
                    isPlaying={currentItem?.id === episode.id && playerIsPlaying}
                    onPlay={() => setCurrentItem(episode)}
                    onPause={() => setCurrentItem(null)}
                    adminMode={adminMode}
                    onDelete={() => handleDelete(episode.id, 'episode')}
                  />
                ))}
              </div>

              {episodes.length > 5 && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                    className="text-do-blue hover:underline font-semibold flex items-center gap-2 mx-auto"
                  >
                    {showAllEpisodes ? (
                      <>
                        Show Less
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Show {episodes.length - 5} More Episodes
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Teasers Section */}
        {!loading && teasers.length > 0 && (
          <div className="space-y-8 mt-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Teasers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(showAllTeasers ? teasers : teasers.slice(0, 5)).map((teaser, index) => (
                <div key={teaser.id} className="relative flex">
                  <button
                    onClick={() => {
                      if (currentItem?.id === teaser.id && playerIsPlaying) {
                        setCurrentItem(null);
                      } else {
                        setCurrentItem(teaser);
                      }
                    }}
                    className={`w-full text-left bg-white dark:bg-gray-800 border rounded-lg p-6 shadow-sm hover:shadow-md transition-all flex flex-col ${
                      currentItem?.id === teaser.id && playerIsPlaying
                        ? 'border-do-blue ring-2 ring-do-blue'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {index === 0 && (
                        <span className="inline-block bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Latest Teaser
                        </span>
                      )}
                      {currentItem?.id === teaser.id && playerIsPlaying && (
                        <span className="text-xs bg-do-blue text-white px-2 py-1 rounded-full">
                          Playing
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex-grow">
                      {teaser.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-auto">
                      {new Date(teaser.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                  {adminMode && (
                    <button
                      onClick={() => handleDelete(teaser.id, 'teaser')}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 transition-colors"
                      aria-label="Delete teaser"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {teasers.length > 5 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAllTeasers(!showAllTeasers)}
                  className="text-do-blue hover:underline font-semibold flex items-center gap-2 mx-auto"
                >
                  {showAllTeasers ? (
                    <>
                      Show Less
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Show {teasers.length - 5} More Teasers
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-500">
          <p>
            Demo for DigitalOcean Hackathon | Built with Next.js, deployed on DO App Platform
          </p>
        </footer>
      </div>

      {/* Persistent Player */}
      <PersistentPlayer
        currentItem={currentItem}
        onClose={() => setCurrentItem(null)}
        onPlayingChange={handlePlayingChange}
      />

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onSubmit={handlePasswordSubmit}
        onCancel={() => setShowPasswordModal(false)}
      />
    </main>
  );
}
