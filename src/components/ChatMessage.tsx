import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

// Enhanced TypingIndicator component with better animation
const TypingIndicator: React.FC<{ color: string }> = ({ color }) => {
  // Rather than changing the whole text, we'll control the visibility of each dot
  const [dot1Opacity, setDot1Opacity] = useState(1);
  const [dot2Opacity, setDot2Opacity] = useState(0.3);
  const [dot3Opacity, setDot3Opacity] = useState(0.3);
  
  useEffect(() => {
    // Animate dots in sequence
    const animateDots = () => {
      // Animation sequence - 400ms per step
      setTimeout(() => setDot1Opacity(1), 0);
      setTimeout(() => setDot2Opacity(0.3), 0);
      setTimeout(() => setDot3Opacity(0.3), 0);
      
      setTimeout(() => setDot1Opacity(0.3), 400);
      setTimeout(() => setDot2Opacity(1), 400);
      
      setTimeout(() => setDot2Opacity(0.3), 800);
      setTimeout(() => setDot3Opacity(1), 800);
    };
    
    // Start animation immediately
    animateDots();
    
    // Set up interval to repeat animation
    const interval = setInterval(animateDots, 1200);
    
    // Clean up
    return () => clearInterval(interval);
  }, []);
  
  return (
    <View style={styles.typingContainer}>
      <Text style={[styles.typingDot, { opacity: dot1Opacity, color }]}>•</Text>
      <Text style={[styles.typingDot, { opacity: dot2Opacity, color }]}>•</Text>
      <Text style={[styles.typingDot, { opacity: dot3Opacity, color }]}>•</Text>
    </View>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUserMessage = message.sender === 'user';
  const messageType = message.messageType || 'text';
  
  // Special handling for empty content
  // Don't show "No message content" for loading messages
  const messageContent = message.isLoading 
    ? '' 
    : message.content || 'No message content';

  // Log if content is missing or message is malformed
  React.useEffect(() => {
    if (!message.content && !message.isLoading) {
      console.warn('ChatMessage received with empty content:', JSON.stringify(message, null, 2));
    }
  }, [message]);

  // Get style based on message type
  const getMessageStyle = () => {
    switch (messageType) {
      case 'thinking':
        return styles.thinkingMessage;
      case 'media':
        return styles.mediaMessage;
      default:
        return isUserMessage ? styles.userMessageText : styles.aiMessageText;
    }
  };

  // Get bubble style based on message type
  const getBubbleStyle = () => {
    switch (messageType) {
      case 'thinking':
        return styles.thinkingBubble;
      case 'media':
        return styles.mediaBubble;
      default:
        return isUserMessage ? styles.userBubble : styles.aiBubble;
    }
  };

  return (
    <View
      style={[
        styles.container,
        isUserMessage ? styles.userContainer : styles.aiContainer,
      ]}>
      <View
        style={[
          styles.bubble,
          getBubbleStyle(),
          message.isLoading && styles.loadingBubble,
        ]}>
        {message.isLoading ? (
          <TypingIndicator color={isUserMessage ? '#FFFFFF' : '#007AFF'} />
        ) : (
          <Text style={[
            styles.messageText,
            getMessageStyle()
          ]}>
            {messageContent}
          </Text>
        )}
        <Text style={[
          styles.timestamp,
          isUserMessage ? styles.userTimestamp : styles.aiTimestamp
        ]}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    marginVertical: 4,
    flexDirection: 'row',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  userBubble: {
    backgroundColor: '#007AFF', // iOS blue color for user messages
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#F2F2F7', // Light gray for AI messages
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingBubble: {
    backgroundColor: '#F2F2F7', // Same as AI bubble
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    minWidth: 40,  // Ensure bubble has minimum width for spinner
    minHeight: 30, // Ensure bubble has minimum height for spinner
    justifyContent: 'center',
    alignItems: 'center',
  },
  thinkingBubble: {
    backgroundColor: '#E1E1E6', // Slightly darker gray for thinking messages
    borderTopLeftRadius: 4,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#C7C7CC',
  },
  mediaBubble: {
    backgroundColor: '#EFF5FD', // Light blue tint for media messages
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDAFF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF', // White text for user messages
  },
  aiMessageText: {
    color: '#000000', // Black text for AI messages
  },
  thinkingMessage: {
    color: '#3A3A3C', // Darker gray for thinking messages
    fontStyle: 'italic',
  },
  mediaMessage: {
    color: '#0056B3', // Blue text for media messages
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)', // Slightly transparent white for user bubble timestamps
  },
  aiTimestamp: {
    color: '#8E8E93', // Medium gray for AI bubble timestamps
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    fontSize: 24,
    lineHeight: 24,
    height: 24,
    marginHorizontal: 2,
  }
});

export default ChatMessage; 