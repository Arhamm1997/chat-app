'use client';
import { useCallback, useRef } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useChat } from '@/context/ChatContext';

export function useTyping() {
  const { socket } = useSocket();
  const { state } = useChat();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    if (!socket || !state.currentRoom || isTypingRef.current) return;

    isTypingRef.current = true;
    socket.emit('typing', {
      roomId: state.currentRoom,
      isTyping: true
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [socket, state.currentRoom]);

  const stopTyping = useCallback(() => {
    if (!socket || !state.currentRoom || !isTypingRef.current) return;

    isTypingRef.current = false;
    socket.emit('typing', {
      roomId: state.currentRoom,
      isTyping: false
    });

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, state.currentRoom]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      stopTyping();
    }
  }, [stopTyping]);

  return {
    startTyping,
    stopTyping,
    cleanup,
    isTyping: isTypingRef.current
  };
}
