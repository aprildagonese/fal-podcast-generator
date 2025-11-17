'use client';

import { useState, useEffect, useRef } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

export default function PasswordModal({ isOpen, onSubmit, onCancel }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
      setPassword('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          🔒 Enter Admin Password
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-do-blue focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter password..."
            autoComplete="off"
          />
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                setPassword('');
                onCancel();
              }}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-do-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
