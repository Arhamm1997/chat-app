// src/context/ChatContext.tsx
'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Message, User } from '@/types/chat';

interface ChatState {
  currentRoom: string | null;
  currentUser: string | null;
  messages: Message[];
  users: User[];
  typingUsers: string[];
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'SET_ROOM'; payload: string }
  | { type: 'SET_USER'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'USER_JOINED'; payload: User }
  | { type: 'USER_LEFT'; payload: string }
  | { type: 'SET_TYPING'; payload: { username: string; isTyping: boolean } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_CHAT' };

const initialState: ChatState = {
  currentRoom: null,
  currentUser: null,
  messages: [],
  users: [],
  typingUsers: [],
  isLoading: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_ROOM':
      return { ...state, currentRoom: action.payload };
    
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    
    case 'SET_USERS':
      return { ...state, users: action.payload };
    
    case 'USER_JOINED':
      const userExists = state.users.some(user => user.username === action.payload.username);
      if (!userExists) {
        return {
          ...state,
          users: [...state.users, action.payload],
        };
      }
      return state;
    
    case 'USER_LEFT':
      return {
        ...state,
        users: state.users.filter(user => user.username !== action.payload),
        typingUsers: state.typingUsers.filter(user => user !== action.payload),
      };
    
    case 'SET_TYPING':
      const { username, isTyping } = action.payload;
      if (isTyping) {
        return {
          ...state,
          typingUsers: state.typingUsers.includes(username) 
            ? state.typingUsers 
            : [...state.typingUsers, username],
        };
      } else {
        return {
          ...state,
          typingUsers: state.typingUsers.filter(user => user !== username),
        };
      }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_CHAT':
      return {
        ...initialState,
        currentUser: state.currentUser, // Keep user info
      };
    
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};