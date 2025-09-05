// src/components/chat/UserList.tsx
'use client';
import { User } from '@/types/chat';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { OnlineIndicator } from './OnlineIndicator';
import { Users as UsersIcon, Crown } from 'lucide-react';

interface UserListProps {
  users: User[];
  typingUsers: string[];
}

export function UserList({ users, typingUsers }: UserListProps) {
  const sortedUsers = [...users].sort((a, b) => {
    // Sort by join time (earliest first)
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <UsersIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Online ({users.length})
          </h3>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto">
        {sortedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4">
            <UsersIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No users online
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedUsers.map((user, index) => (
              <div
                key={user.username}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar
                    size="md"
                    fallback={user.username}
                  />
                  <OnlineIndicator isOnline={user.isOnline} />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {user.username}
                    </span>
                    
                    {/* First user gets crown */}
                    {index === 0 && (
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" title="Room Creator" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    {/* Typing indicator */}
                    {typingUsers.includes(user.username) ? (
                      <Badge variant="secondary" size="sm">
                        typing...
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {user.isOnline ? 'Online' : 'Away'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Users are sorted by join time
        </div>
      </div>
    </div>
  );
}