'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND_URL = 'http://192.168.30.21:5000';  // 👈 Your IP address;

interface Room {
  roomId: string;
  name: string;
  userCount: number;
  messageCount: number;
  lastActivity: string;
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);

  useEffect(() => {
    checkBackendConnection();
    loadRecentRooms();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setBackendStatus('disconnected');
    }
  };

  const loadRecentRooms = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rooms?limit=5`);
      const data = await response.json();
      
      if (data.success && data.rooms) {
        setRecentRooms(data.rooms);
      }
    } catch (error) {
      console.error('Failed to load recent rooms:', error);
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (backendStatus !== 'connected') {
      setError('Backend server is not connected. Please make sure the server is running on port 5000.');
      return;
    }

    setIsCreating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName.trim() || undefined
        }),
      });

      const data = await response.json();
      console.log('Room creation response:', data);

      if (data.success) {
        setSuccess(`Room created successfully! Room ID: ${data.roomId}`);
        setRoomName('');
        
        // Auto-navigate to the room after 2 seconds
        setTimeout(() => {
          router.push(`/room/${data.roomId}`);
        }, 2000);
        
        // Refresh recent rooms
        loadRecentRooms();
      } else {
        setError(data.message || 'Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    if (joinRoomId.trim().length !== 6) {
      setError('Room ID must be exactly 6 characters');
      return;
    }

    if (backendStatus !== 'connected') {
      setError('Backend server is not connected. Please make sure the server is running on port 5000.');
      return;
    }

    setIsJoining(true);
    setError('');
    setSuccess('');

    try {
      const roomId = joinRoomId.trim().toUpperCase();
      const response = await fetch(`${BACKEND_URL}/api/rooms/${roomId}`);
      const data = await response.json();

      if (data.success) {
        router.push(`/room/${roomId}`);
      } else {
        setError('Room not found. Please check the room ID.');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setIsJoining(false);
    }
  };

  const joinExistingRoom = (roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Backend Status Indicator */}
      <div className="fixed top-4 right-4 flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          backendStatus === 'connected' ? 'bg-green-500' : 
          backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
        }`}></div>
        <span className="text-sm text-gray-600">
          Backend: {backendStatus === 'connected' ? 'Connected' : 
                   backendStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
        </span>
      </div>

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            💬 Anonymous Chat
          </h1>
          <p className="text-gray-600">
            Create or join a room to start chatting anonymously
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">✅ {success}</p>
          </div>
        )}

        {/* Backend Connection Warning */}
        {backendStatus === 'disconnected' && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 text-sm">
              ⚠️ Cannot connect to backend server. Please ensure:
            </p>
            <ul className="text-yellow-700 text-sm mt-2 ml-4 list-disc">
              <li>Backend server is running on port 5000</li>
              <li>Run: <code className="bg-yellow-100 px-1 rounded">npm run dev</code> in backend folder</li>
              <li>MongoDB is connected</li>
            </ul>
          </div>
        )}

        {/* Create Room Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🏠 Create New Room
          </h2>
          
          <form onSubmit={createRoom} className="space-y-4">
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
                Room Name (Optional)
              </label>
              <input
                type="text"
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
                disabled={backendStatus !== 'connected'}
              />
            </div>
            
            <button
              type="submit"
              disabled={isCreating || backendStatus !== 'connected'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              {isCreating ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Room...
                </span>
              ) : (
                '🚀 Create Room'
              )}
            </button>
          </form>
        </div>

        {/* Join Room Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🚪 Join Existing Room
          </h2>
          
          <form onSubmit={joinRoom} className="space-y-4">
            <div>
              <label htmlFor="joinRoomId" className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                id="joinRoomId"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                placeholder="Enter 6-character room ID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                maxLength={6}
                disabled={backendStatus !== 'connected'}
              />
            </div>
            
            <button
              type="submit"
              disabled={isJoining || backendStatus !== 'connected'}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              {isJoining ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining Room...
                </span>
              ) : (
                '🏃 Join Room'
              )}
            </button>
          </form>
        </div>

        {/* Recent Rooms */}
        {recentRooms.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📋 Recent Rooms
            </h2>
            
            <div className="space-y-2">
              {recentRooms.map((room) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => joinExistingRoom(room.roomId)}
                >
                  <div>
                    <div className="font-medium text-gray-800">
                      {room.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {room.roomId} • {room.userCount} online • {room.messageCount} messages
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Join →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>No registration required • Anonymous chatting • Rooms auto-expire</p>
        </div>
      </div>
    </div>
  );
}