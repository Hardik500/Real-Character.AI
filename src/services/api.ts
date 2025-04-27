import axios from 'axios';
import { UserProfile, QuestionRequest, AnswerResponse, ConversationHistoryResponse, ConversationHistoryCreate } from '@/types';

// Create Axios instance with base URL
// Using the IP address instead of localhost since the mobile device can't access localhost on your computer
const API_URL = 'http://192.168.68.104:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes timeout
});

// User-related endpoints
export const getUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    console.log('Fetching user profiles from:', `${API_URL}/personalities/active-users`);
    const response = await api.get('/personalities/active-users');
    console.log('API response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return [];
  }
};

// Chat-related endpoints
export const sendMessage = async (username: string, message: string): Promise<AnswerResponse> => {
  try {
    const questionRequest: QuestionRequest = {
      question: message,
    };
    
    console.log(`Sending message to ${username}:`, message);
    const response = await api.post(`/personalities/users/${username}/ask`, questionRequest);
    console.log('Response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Conversation history endpoints
export const getConversationHistory = async (userId: number): Promise<ConversationHistoryResponse[]> => {
  const response = await api.get(`/conversations/history/${userId}`);
  return response.data;
};

export const addConversationHistory = async (entry: ConversationHistoryCreate): Promise<ConversationHistoryResponse> => {
  const response = await api.post(`/conversations/history/`, entry);
  return response.data;
};

export const clearConversationHistory = async (userId: number): Promise<void> => {
  await api.delete(`/conversations/history/${userId}`);
};

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`API Error: ${error.response.status} from ${error.config.url}`);
      console.error('Error response:', error.response.data);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 