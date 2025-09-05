// src/types/user.ts
export interface UserProfile {
  username: string;
  isOnline: boolean;
  currentRoom?: string;
  joinedAt: Date;
}