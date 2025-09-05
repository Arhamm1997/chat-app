'use client';
import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { useChat } from '@/context/ChatContext';
import { useSocket } from '@/context/SocketContext';
import { MessageCircle } from 'lucide-react';

export function ChatWindow() {
  const { state } = useChat();
  const { isConnected } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [state.messages]);

  // Show welcome message if no messages
  const showWelcome = state.messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Welcome to Room {state.currentRoom}!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 max-w-md">
              Start chatting with others in this room. Your messages will appear here in real-time.
            </p>
            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              💡 Tip: Others can join using room ID: <strong>{state.currentRoom}</strong>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            {state.messages.map((message, index) => (
              <MessageBubble
                key={message.id || index}
                message={message}
                isOwn={message.sender.username === state.currentUser}
                showAvatar={
                  index === 0 ||
                  state.messages[index - 1]?.sender.username !== message.sender.username
                }
              />
            ))}

            {/* Typing Indicator */}
            {state.typingUsers.length > 0 && (
              <TypingIndicator users={state.typingUsers} />
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <MessageInput disabled={!isConnected || !state.currentRoom} />
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 px-4 py-2">
          <div className="text-center text-red-700 dark:text-red-300 text-sm">
            🔌 Connection lost. Trying to reconnect...
          </div>
        </div>
      )}
    </div>
  );
}