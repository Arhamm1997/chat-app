/ src/types/chat.ts
export interface Message {
  id: string;
  content: string;
  sender: {
    username: string;
    socketId?: string;
  };
  type: 'message' | 'system';
  createdAt: Date;
}

export interface User {
  username: string;
  isOnline: boolean;
  joinedAt: Date;
  isTyping?: boolean;
}

export interface Room {
  roomId: string;
  name: string;
  userCount: number;
  messageCount: number;
  createdAt: Date;
  lastActivity: Date;
}
