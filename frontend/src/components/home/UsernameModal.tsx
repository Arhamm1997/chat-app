// src/components/home/UsernameModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dice6, User, Shuffle } from 'lucide-react';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsernameSet: (username: string) => void;
  initialUsername?: string;
}

// Simple username generator
const generateUsername = () => {
  const adjectives = [
    'Shadow', 'Silent', 'Mystic', 'Ghost', 'Cyber', 'Neon', 'Electric', 'Swift',
    'Clever', 'Bold', 'Fierce', 'Storm', 'Fire', 'Crystal', 'Golden', 'Cosmic'
  ];
  
  const nouns = [
    'Wolf', 'Eagle', 'Dragon', 'Phoenix', 'Raven', 'Tiger', 'Lion', 'Fox',
    'Knight', 'Warrior', 'Hunter', 'Guardian', 'Ninja', 'Phantom', 'Spirit'
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`;
};

export function UsernameModal({ isOpen, onClose, onUsernameSet, initialUsername }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && !initialUsername) {
      setUsername(generateUsername());
    } else if (initialUsername) {
      setUsername(initialUsername);
    }
  }, [isOpen, initialUsername]);

  const handleGenerateUsername = () => {
    setUsername(generateUsername());
    setError('');
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setUsername(value);
    
    if (value.length < 3) {
      setError('Username must be at least 3 characters long');
    } else if (value.length > 20) {
      setError('Username must be less than 20 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setError('Username can only contain letters, numbers, and underscores');
    } else {
      setError('');
    }
  };

  const handleSubmit = () => {
    if (username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)) {
      onUsernameSet(username);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !error && username.length >= 3) {
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Username"
      size="md"
      closeOnOverlayClick={false}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Choose a username for this chat session. You can use the generated name or create your own.
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Username"
              placeholder="Enter username..."
              value={username}
              onChange={handleUsernameChange}
              onKeyPress={handleKeyPress}
              error={error}
              maxLength={20}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateUsername}
              className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
              type="button"
            >
              <Shuffle className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleGenerateUsername}
            className="w-full"
            type="button"
          >
            <Dice6 className="w-4 h-4 mr-2" />
            Generate New Username
          </Button>

          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <div>• Username must be 3-20 characters long</div>
            <div>• Only letters, numbers, and underscores allowed</div>
            <div>• This username is temporary for this session only</div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!!error || username.length < 3}
          >
            <User className="w-4 h-4 mr-2" />
            Continue with "{username}"
          </Button>
        </div>
      </div>
    </Modal>
  );
}