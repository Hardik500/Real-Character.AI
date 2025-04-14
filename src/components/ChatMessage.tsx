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
          <Text style={styles.messageText}>{message.content}</Text>
        )}
        <Text style={styles.timestamp}>
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
  },
  userBubble: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
  },
  timestamp: {
    fontSize: 11,
    color: '#999999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#777',
  },
});

export default ChatMessage; 