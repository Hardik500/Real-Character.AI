import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUserMessage = message.sender === 'user';

  return (
    <View
      style={[
        styles.container,
        isUserMessage ? styles.userContainer : styles.aiContainer,
      ]}>
      <View
        style={[
          styles.bubble,
          isUserMessage ? styles.userBubble : styles.aiBubble,
        ]}>
        {message.isLoading ? (
          <Text style={styles.loadingText}>...</Text>
        ) : (
          <Text style={[
            styles.messageText,
            isUserMessage ? styles.userMessageText : styles.aiMessageText
          ]}>
            {message.content}
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
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});

export default ChatMessage; 