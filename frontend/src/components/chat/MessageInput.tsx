// src/components/chat/MessageInput.tsx
'use client';
import { useState, useRef, useCallback } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmojiPicker } from './EmojiPicker';
import { useSocket } from '@/context/SocketContext';
import { useChat } from '@/context/ChatContext';
import { useTyping } from '@/hooks/useTyping';

interface MessageInputProps {
  disabled?: boolean;
}

export function MessageInput({ disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { socket } = useSocket();
  const { state } = useChat();
  const { startTyping, stopTyping } = useTyping();

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    adjustTextareaHeight();

    // Handle typing indicators
    if (value.trim() && !disabled) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage || disabled || !socket || !state.currentRoom) {
      return;
    }

    // Send message via socket
    socket.emit('sendMessage', {
      roomId: state.currentRoom,
      content: trimmedMessage
    });

    // Clear input and stop typing
    setMessage('');
    stopTyping();
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    // Focus back to input
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      
      setMessage(newMessage);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        adjustTextareaHeight();
      }, 0);
    }
    
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative p-4">
      <div className="flex items-end space-x-3">
        {/* Emoji Picker Button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className="flex-shrink-0"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2">
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={disabled ? "Connecting..." : "Type a message..."}
            disabled={disabled}
            rows={1}
            className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          
          {/* Character counter */}
          {message.length > 800 && (
            <div className={`absolute bottom-1 right-12 text-xs ${
              message.length > 1000 ? 'text-red-500' : 'text-gray-400'
            }`}>
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendMessage}
          disabled={disabled || !message.trim() || message.length > 1000}
          size="icon"
          className="flex-shrink-0 h-12 w-12"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}