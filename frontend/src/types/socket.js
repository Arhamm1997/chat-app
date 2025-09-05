/ src/types/socket.ts
export interface ServerToClientEvents {
  joinedRoom: (data: {
    roomId: string;
    username: string;
    users: User[];
  }) => void;
  newMessage: (message: Message) => void;
  userJoined: (data: {
    username: string;
    message: Message;
  }) => void;
  userLeft: (data: {
    username: string;
    message: Message;
  }) => void;
  userListUpdated: (data: {
    users: User[];
  }) => void;
  userTyping: (data: {
    username: string;
    isTyping: boolean;
  }) => void;
  error: (error: { message: string }) => void;
}

export interface ClientToServerEvents {
  joinRoom: (data: {
    roomId: string;
    username?: string;
  }) => void;
  sendMessage: (data: {
    roomId: string;
    content: string;
  }) => void;
  typing: (data: {
    roomId: string;
    isTyping: boolean;
  }) => void;
}
