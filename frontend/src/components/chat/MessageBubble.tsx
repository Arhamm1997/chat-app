// src/components/chat/MessageBubble.tsx
'use client';
import { Message } from '@/types/chat';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  const isSystem = message.type === 'system';
  
  // Format timestamp
  const formatTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    // If today, show time only
    if (messageDate.toDateString() === now.toDateString()) {
      return format(messageDate, 'HH:mm');
    }
    
    // If this year, show month/day and time
    if (messageDate.getFullYear() === now.getFullYear()) {
      return format(messageDate, 'MMM d, HH:mm');
    }
    
    // Otherwise show full date
    return format(messageDate, 'MMM d, yyyy HH:mm');
  };

  // System messages (user joined/left)
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 max-w-xs text-center">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-end space-x-2',
      isOwn ? 'justify-end' : 'justify-start'
    )}>
      {/* Avatar - only show for received messages */}
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0">
          <Avatar
            size="sm"
            fallback={message.sender.username}
          />
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        'flex flex-col max-w-[70%]',
        isOwn ? 'items-end' : 'items-start'
      )}>
        {/* Username - only show for received messages and when showing avatar */}
        {!isOwn && showAvatar && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-3">
            {message.sender.username}
          </div>
        )}

        {/* Message Bubble */}
        <div className={cn(
          'relative px-4 py-2 rounded-2xl shadow-sm max-w-full break-words',
          isOwn
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-600'
        )}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {/* Timestamp */}
          <div className={cn(
            'text-xs mt-1 opacity-70',
            isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          )}>
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>

      {/* Spacer for own messages to align with avatar space */}
      {isOwn && <div className="w-8" />}
    </div>
  );
}