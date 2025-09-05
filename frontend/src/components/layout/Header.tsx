// src/components/layout/Header.tsx
'use client';
import { MessageCircle, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Badge } from '@/components/ui/Badge';

interface HeaderProps {
  roomId?: string;
  userCount?: number;
  onLeaveRoom?: () => void;
  onToggleUserList?: () => void;
  showUserListButton?: boolean;
}

export function Header({ 
  roomId, 
  userCount = 0, 
  onLeaveRoom, 
  onToggleUserList,
  showUserListButton = false 
}: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {roomId ? `Room ${roomId}` : 'Anonymous Chat'}
            </h1>
            {roomId && (
              <div className="flex items-center space-x-2">
                <Badge variant="success" size="sm">
                  {userCount} online
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showUserListButton && (
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleUserList}
              className="md:hidden"
            >
              <Users className="w-4 h-4" />
            </Button>
          )}
          
          <ThemeToggle />
          
          {onLeaveRoom && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLeaveRoom}
              className="hidden sm:flex"
            >
              Leave Room
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}