// src/components/chat/OnlineIndicator.tsx
'use client';
import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md';
}

export function OnlineIndicator({ isOnline, size = 'sm' }: OnlineIndicatorProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };

  return (
    <div className={cn(
      'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white dark:border-gray-800',
      sizeClasses[size],
      isOnline 
        ? 'bg-green-500 shadow-lg' 
        : 'bg-gray-400 dark:bg-gray-600'
    )}>
      {isOnline && (
        <div className={cn(
          'absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75',
          sizeClasses[size]
        )} />
      )}
    </div>
  );
}