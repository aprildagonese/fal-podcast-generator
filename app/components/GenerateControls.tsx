'use client';

import { useState } from 'react';

interface GenerateControlsProps {
  onGenerated: () => void;
}

export default function GenerateControls({ onGenerated }: GenerateControlsProps) {
  const [isGeneratingEpisode, setIsGeneratingEpisode] = useState(false);
  const [isGeneratingTeaser, setIsGeneratingTeaser] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const generateEpisode = async () => {
    setIsGeneratingEpisode(true);
    setError('');
    setStatus('🔍 Querying AI news from Knowledge Base...');

    try {
      const response = await fetch('/api/generate-episode', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate episode');
      }

      setStatus('✍️ Generating podcast script...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatus('🎙️ Creating audio with fal.ai TTS...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      setStatus('✅ Episode created successfully!');
      setTimeout(() => {
        setStatus('');
        onGenerated();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setStatus('');
    } finally {
      setIsGeneratingEpisode(false);
    }
  };

  const generateTeaser = async () => {
    setIsGeneratingTeaser(true);
    setError('');
    setStatus('🔍 Querying AI news...');

    try {
      const response = await fetch('/api/generate-teaser', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate teaser');
      }

      setStatus('🎙️ Creating teaser...');

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      setStatus('✅ Teaser created successfully!');
      setTimeout(() => {
        setStatus('');
        onGenerated();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setStatus('');
    } finally {
      setIsGeneratingTeaser(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Generate New Content
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create a full episode or a quick teaser from today's AI news
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={generateEpisode}
          disabled={isGeneratingEpisode || isGeneratingTeaser}
          className="bg-do-blue hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {isGeneratingEpisode ? 'Generating...' : 'Generate Full Episode'}
        </button>

        <button
          onClick={generateTeaser}
          disabled={isGeneratingEpisode || isGeneratingTeaser}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {isGeneratingTeaser ? 'Generating...' : 'Generate Teaser'}
        </button>
      </div>

      {status && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-700 dark:text-gray-300">{status}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Powered by DO Gradient (Anthropic) + fal.ai TTS
      </div>
    </div>
  );
}
