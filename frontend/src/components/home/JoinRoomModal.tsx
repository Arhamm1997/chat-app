'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, Loader2, CheckCircle } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomJoined: (roomId: string) => void;
}

export function JoinRoomModal({ isOpen, onClose, onRoomJoined }: JoinRoomModalProps) {
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomExists, setRoomExists] = useState<boolean | null>(null);

  const checkRoomExists = async (id: string) => {
    if (id.length < 6) {
      setRoomExists(null);
      return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/rooms/${id}/exists`);
      const data = await response.json();
      
      if (data.success) {
        setRoomExists(data.exists);
        setError(data.exists ? '' : 'Room not found');
      }
    } catch (err) {
      setRoomExists(null);
    }
  };

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomId(value);
    setError('');
    
    // Debounce room existence check
    if (value.length >= 6) {
      const timeoutId = setTimeout(() => checkRoomExists(value), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setRoomExists(null);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim() || roomId.length !== 6) {
      setError('Please enter a valid 6-character room ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/rooms/${roomId}/exists`);
      const data = await response.json();

      if (data.success && data.exists) {
        onRoomJoined(roomId);
        setRoomId('');
        setRoomExists(null);
      } else {
        setError('Room not found. Please check the room ID.');
      }
    } catch (err) {
      setError('Failed to join room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setRoomId('');
      setError('');
      setRoomExists(null);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && roomId.length === 6) {
      handleJoinRoom();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Join Room"
      size="md"
      closeOnOverlayClick={!isLoading}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Enter a room ID to join an existing chat room and start messaging!
          </p>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Room ID"
              placeholder="ABC123"
              value={roomId}
              onChange={handleRoomIdChange}
              onKeyPress={handleKeyPress}
              error={error}
              maxLength={6}
              disabled={isLoading}
              className="text-center text-lg font-mono tracking-wider"
            />
            {roomId.length === 6 && roomExists === true && (
              <div className="absolute right-3 top-9">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <div>💡 Room IDs are 6 characters long (letters and numbers)</div>
            <div>🔍 We'll check if the room exists as you type</div>
          </div>

          {roomExists === true && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center text-green-700 dark:text-green-300">
                <CheckCircle className="w-4 h-4 mr-2" />
                Room found! Ready to join.
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleJoinRoom}
            className="flex-1"
            disabled={isLoading || roomId.length !== 6 || roomExists === false}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Join Room
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}