import axios from 'axios';
import { UserProfile, QuestionRequest, AnswerResponse, ConversationHistoryResponse, ConversationHistoryCreate } from '@/types';

// For TypeScript compatibility with streaming API
declare global {
  interface Response {
    body?: ReadableStream<Uint8Array>;
  }
  
  interface ReadableStream<R = any> {
    getReader(): ReadableStreamDefaultReader<R>;
  }
  
  interface ReadableStreamDefaultReader<R = any> {
    read(): Promise<ReadableStreamReadResult<R>>;
    releaseLock(): void;
    closed: Promise<void>;
  }
  
  interface ReadableStreamReadResult<T> {
    done: boolean;
    value?: T;
  }
  
  class TextDecoder {
    constructor(encoding?: string);
    decode(input?: Uint8Array, options?: { stream?: boolean }): string;
  }
}

// Create Axios instance with base URL
// Using the IP address instead of localhost since the mobile device can't access localhost on your computer
const API_URL = 'http://192.168.68.101:8000';

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
    console.log('Raw response data:', JSON.stringify(response.data, null, 2));
    
    // Process the response to ensure correct formatting
    let processedResponse = response.data;
    
    // Convert legacy format to new format if needed
    if (processedResponse && 'answer' in processedResponse && !('answers' in processedResponse)) {
      console.log('Converting legacy response format to new format');
      processedResponse.answers = [{ 
        content: processedResponse.answer, 
        type: 'text' 
      }];
    }
    
    // Validate each answer in the answers array
    if (processedResponse && processedResponse.answers && Array.isArray(processedResponse.answers)) {
      processedResponse.answers = processedResponse.answers.map((answer: any, index: number) => {
        // Ensure each answer has content and type properties
        if (!answer.content) {
          console.warn(`Answer ${index} is missing content:`, answer);
          return {
            content: "Empty response from server",
            type: answer.type || 'text'
          };
        }
        
        if (!answer.type) {
          console.log(`Answer ${index} missing type, defaulting to 'text'`);
          answer.type = 'text';
        }
        
        return answer;
      });
    } else if (!processedResponse.answers) {
      // Create a default answers array if it doesn't exist
      console.warn('Response missing answers array, creating default');
      processedResponse.answers = [{ 
        content: "Invalid response format from server", 
        type: 'text' 
      }];
    }
    
    console.log('Processed response:', JSON.stringify(processedResponse, null, 2));
    return processedResponse;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Streaming API endpoint for multi-message support
export const sendStreamingMessage = async (username: string, message: string, 
  onToken: (token: string) => void,
  onComplete: (messages: any[]) => void
): Promise<void> => {
  try {
    // We don't need questionRequest for non-streaming approach
    console.log(`Sending streaming message to ${username}:`, message);
    
    // React Native environment check - use non-streaming approach
    console.log('Using React Native compatible approach for streaming');
    
    // Simulate streaming by breaking up the response
    const response = await sendMessage(username, message);
    console.log('Got response for simulated streaming:', JSON.stringify(response, null, 2));
    
    if (response.answers && response.answers.length > 0) {
      // For each answer, simulate streaming by sending characters one by one
      console.log(`Found ${response.answers.length} answers to stream`);
      
      for (const answer of response.answers) {
        console.log('Streaming answer:', JSON.stringify(answer, null, 2));
        
        if (answer.content) {
          // Break the message into chunks to simulate streaming
          const content = answer.content;
          console.log(`Content length: ${content.length} characters`);
          
          // Add a small initial delay to allow UI to show typing indicator
          await new Promise<void>(resolve => setTimeout(resolve, 500));
          
          // Stream each character with a small delay - use words instead of characters for better UX
          const words = content.split(/(\s+)/);
          console.log(`Split into ${words.length} words/spaces`);
          
          // Send first token immediately to replace "Typing..."
          if (words.length > 0) {
            onToken(words[0]);
            console.log(`Streamed first word immediately: "${words[0]}"`);
          }
          
          // Stream the rest with delay
          for (let i = 1; i < words.length; i++) {
            const word = words[i];
            // Use a longer delay for better UX
            await new Promise<void>(resolve => setTimeout(resolve, 50)); // Longer delay between words
            onToken(word);
            console.log(`Streamed word: "${word}"`);
          }
        } else {
          console.warn('Answer has no content:', answer);
          // Send a placeholder to avoid empty message
          onToken("No content available");
        }
      }
      
      // When done streaming, send the complete messages
      console.log('Streaming complete, sending final messages');
      
      // Make sure all messages have content
      const validatedMessages = response.answers.map((msg: any) => {
        if (!msg.content) {
          return {
            ...msg,
            content: "No content available",
            type: msg.type || 'text'
          };
        }
        return msg;
      });
      
      onComplete(validatedMessages);
    } else {
      // Handle empty response
      console.warn('No answers in response for streaming');
      onComplete([{ content: 'No response content', type: 'text' }]);
    }
  } catch (error) {
    console.error('Error in streaming message:', error);
    onComplete([{ content: 'Error: Failed to get response', type: 'text' }]);
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