/**
 * Common type definitions for AI Social App
 */

// User related types
export interface User {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  followers?: number;
  following?: number;
  joined: Date;
}

// Authentication types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

// AI Content types
export interface AIContent {
  id: string;
  creator: User;
  prompt: string;
  generatedContent: string;
  contentType: 'image' | 'text' | 'audio' | 'video';
  createdAt: Date;
  likes: number;
  comments: number;
  shares: number;
}

// Comment type
export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  likes: number;
  replies?: Comment[];
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  ContentDetail: { contentId: string };
  CreateContent: undefined;
  Settings: undefined;
  Login: undefined;
  Register: undefined;
  Notifications: undefined;
  Search: undefined;
  Chat: { userId: string; username: string; profilePicture?: string };
  Ingest: undefined;
};

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  status: number;
}

// Chat related types
export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  isLoading?: boolean;
  messageType?: string; // Type of message: 'text', 'thinking', 'media', etc.
}

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  description?: string;
  created_at: string;
  profilePicture?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
}

export interface QuestionRequest {
  question: string;
  multi_message?: boolean; // Flag to request multiple messages if appropriate
}

export interface MessageContent {
  content: string;
  type: string; // 'text', 'thinking', 'media', etc.
}

export interface AnswerResponse {
  question: string;
  answers: MessageContent[];
  username: string;
  conversation_context?: {
    topic?: string;
    tone?: string;
    interests_matched?: string[];
  };
}

export interface ConversationHistoryResponse {
  id: number;
  user_id: number;
  role: 'user' | 'ai';
  content: string;
  created_at: string;
}

export interface ConversationHistoryCreate {
  user_id: number;
  role: 'user' | 'ai';
  content: string;
}
