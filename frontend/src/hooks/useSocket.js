// frontend/src/hooks/useSocket.js
// Replace your existing useSocket hook with this

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL, socketConfig } from '../config/api';

export const useSocket = () => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log('🔌 Attempting to connect to:', SOCKET_URL);

    // Create new socket connection
    socketRef.current = io(SOCKET_URL, socketConfig.options);

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected:', socketRef.current.id);
      setConnected(true);
      setConnectionAttempts(0);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setConnected(false);
      setConnectionAttempts(prev => prev + 1);
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setConnected(true);
    });

    socketRef.current.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error.message);
    });

    socketRef.current.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
      setConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Socket methods
  const emit = (event, data) => {
    if (socketRef.current && connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    console.warn('⚠️ Cannot emit - socket not connected');
    return false;
  };

  const on = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  const joinRoom = (roomId, username) => {
    return emit('joinRoom', { roomId: roomId.toUpperCase(), username });
  };

  const sendMessage = (roomId, content) => {
    return emit('sendMessage', { roomId: roomId.toUpperCase(), content });
  };

  const sendTyping = (roomId, isTyping) => {
    return emit('typing', { roomId: roomId.toUpperCase(), isTyping });
  };

  const leaveRoom = (roomId) => {
    return emit('leaveRoom', { roomId: roomId.toUpperCase() });
  };

  return {
    socket: socketRef.current,
    connected,
    connectionAttempts,
    emit,
    on,
    off,
    joinRoom,
    sendMessage,
    sendTyping,
    leaveRoom
  };
};