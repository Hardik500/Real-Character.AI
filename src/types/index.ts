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
};

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  status: number;
}
