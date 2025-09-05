'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: string;
  content: string;
  sender: {
    username: string;
    socketId: string;
  };
  createdAt: string;
  type: 'message' | 'system';
}

interface User {
  username: string;
  isOnline: boolean;
  joinedAt: string;
  isTyping?: boolean;
}

const BACKEND_URL = 'http://192.168.30.21:5000';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null); // Add ref to track socket
  const messageIdsRef = useRef<Set<string>>(new Set()); // Track message IDs to prevent duplicates

  // Memoize the scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Memoized function to add message with duplicate prevention
  const addMessage = useCallback((message: Message) => {
    if (messageIdsRef.current.has(message.id)) {
      console.log('Duplicate message detected, ignoring:', message.id);
      return; // Prevent duplicate
    }
    
    messageIdsRef.current.add(message.id);
    setMessages(prev => [...prev, message]);
    scrollToBottom();
  }, [scrollToBottom]);

  const fetchRoomInfo = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/rooms/${roomId}`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.room.users || []);
      }
    } catch (err) {
      console.error('Error fetching room info:', err);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    
    let isMounted = true; // Flag to prevent state updates on unmounted component
    
    const initializeRoom = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Check if room exists
        const roomResponse = await fetch(`${BACKEND_URL}/api/rooms/${roomId}`);
        const roomData = await roomResponse.json();

        if (!roomData.success) {
          if (isMounted) {
            setError('Room not found. Please check the room ID.');
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setRoomInfo(roomData.room);
        }

        // Load recent messages
        const messagesResponse = await fetch(`${BACKEND_URL}/api/messages/${roomId}?limit=50`);
        const messagesData = await messagesResponse.json();
        
        if (messagesData.success && isMounted) {
          setMessages(messagesData.messages || []);
          // Track existing message IDs
          messageIdsRef.current = new Set(messagesData.messages?.map((m: Message) => m.id) || []);
        }

        // Disconnect existing socket if any
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        // Initialize socket connection
        const newSocket = io(BACKEND_URL, {
          transports: ['websocket', 'polling'],
          forceNew: true, // Force new connection
          timeout: 10000
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          console.log('Connected to server');
          if (isMounted) {
            setIsConnected(true);
            
            // Join room
            newSocket.emit('joinRoom', {
              roomId: roomId,
              username: '' // Will be auto-generated
            });
          }
        });

        newSocket.on('disconnect', () => {
          console.log('Disconnected from server');
          if (isMounted) {
            setIsConnected(false);
          }
        });

        newSocket.on('joinedRoom', (data) => {
          console.log('Joined room:', data);
          if (isMounted) {
            setCurrentUser(data.username);
            setUsers(data.users || []);
            setIsLoading(false);
          }
        });

        // Use the memoized addMessage function
        newSocket.on('newMessage', (message: Message) => {
          if (isMounted) {
            addMessage(message);
          }
        });

        newSocket.on('userJoined', (data) => {
          if (isMounted) {
            if (data.message) {
              addMessage(data.message);
            }
            fetchRoomInfo();
          }
        });

        newSocket.on('userLeft', (data) => {
          if (isMounted) {
            if (data.message) {
              addMessage(data.message);
            }
            fetchRoomInfo();
          }
        });

        newSocket.on('userTyping', (data) => {
          if (isMounted) {
            if (data.isTyping) {
              setTypingUsers(prev => 
                prev.includes(data.username) ? prev : [...prev, data.username]
              );
            } else {
              setTypingUsers(prev => prev.filter(user => user !== data.username));
            }
          }
        });

        newSocket.on('error', (data) => {
          console.error('Socket error:', data);
          if (isMounted) {
            setError(data.message || 'An error occurred');
          }
        });

        if (isMounted) {
          setSocket(newSocket);
        }

      } catch (err) {
        console.error('Error initializing room:', err);
        if (isMounted) {
          setError('Failed to connect to server. Please try again.');
          setIsLoading(false);
        }
      }
    };

    initializeRoom();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [roomId, addMessage, fetchRoomInfo]);

  const sendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !messageInput.trim()) return;

    // Generate a temporary ID for optimistic UI (optional)
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageInput.trim(),
      sender: {
        username: currentUser,
        socketId: socket.id || ''
      },
      createdAt: new Date().toISOString(),
      type: 'message' as const
    };

    // Don't add optimistic message to avoid duplicates
    // Just send to server and wait for response
    socket.emit('sendMessage', {
      roomId: roomId,
      content: messageInput.trim()
    });

    setMessageInput('');
    stopTyping();
  }, [socket, messageInput, roomId, currentUser]);

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    if (!socket) return;

    // Send typing indicator
    socket.emit('typing', { roomId, isTyping: true });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [socket, roomId]);

  const stopTyping = useCallback(() => {
    if (socket) {
      socket.emit('typing', { roomId, isTyping: false });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, roomId]);

  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  }, [roomId]);

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    router.push('/');
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Room Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">
              {roomInfo?.name || 'Anonymous Chat'}
            </h1>
            <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-mono">
              {roomId}
            </span>
            <button
              onClick={copyRoomId}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              📋 Copy ID
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <span className="text-sm text-gray-600">
              👥 {users.length} online
            </span>
            
            <button
              onClick={leaveRoom}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white m-4 rounded-lg shadow-lg overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Welcome to the room! Start a conversation...</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'system' ? 'justify-center' : 
                    message.sender.username === currentUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'system' ? (
                    <div className="bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600">
                      {message.content}
                    </div>
                  ) : (
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender.username === currentUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {message.sender.username !== currentUser && (
                        <div className="text-xs opacity-75 mb-1">
                          {message.sender.username}
                        </div>
                      )}
                      <div>{message.content}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="text-sm text-gray-500 italic">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={messageInput}
                onChange={handleTyping}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isConnected}
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={!isConnected || !messageInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Users Sidebar */}
        <div className="w-64 bg-white m-4 ml-0 rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Online Users ({users.length})</h3>
          <div className="space-y-2">
            {users.map((user, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-2 rounded-lg ${
                  user.username === currentUser ? 'bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`text-sm ${user.username === currentUser ? 'font-semibold' : ''}`}>
                  {user.username}
                  {user.username === currentUser && ' (You)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}