import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ChatMessage, ConversationHistoryResponse } from '@/types';
import ChatMessageComponent from '@components/ChatMessage';
import ChatInput from '@components/ChatInput';
import {
  sendStreamingMessage,
  getConversationHistory,
  clearConversationHistory,
} from '@services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';

// Default avatar for users without a profile picture
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const ChatHeaderTitle = ({ avatarUrl, username }: { avatarUrl: string; username: string }) => (
  <View style={styles.headerContainer}>
    <Image source={{ uri: avatarUrl }} style={styles.avatarSmall} />
    <Text style={styles.headerTitle}>{username}</Text>
  </View>
);

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { userId, username, profilePicture } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);
  const headerHeight = useHeaderHeight();

  // Set up the navigation header
  useEffect(() => {
    const avatarUrl = profilePicture || `${DEFAULT_AVATAR}&name=${encodeURIComponent(username)}`;

    navigation.setOptions({
      title: username,
      headerBackVisible: true,
      headerTitleAlign: 'left',
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#FFFFFF',
      headerTitle: () => <ChatHeaderTitle avatarUrl={avatarUrl} username={username} />,
    });
  }, [navigation, username, profilePicture]);

  // Fetch conversation history from backend (on mount/clear only)
  const fetchHistory = React.useCallback(async () => {
    try {
      const history: ConversationHistoryResponse[] = await getConversationHistory(Number(userId));
      // Map ConversationHistoryResponse to ChatMessage
      const mapped: ChatMessage[] = history.map((msg) => ({
        id: msg.id.toString(),
        content: msg.content,
        sender: msg.role,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(mapped);
    } catch (error) {
      console.error('Failed to fetch conversation history:', error);
    }
  }, [userId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Optimistic UI for sending messages
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || sending) {return;}
    setSending(true);

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
    };
    setMessages(prev => [...prev, userMsg]);

    // Add AI loading message
    const aiLoadingMsg: ChatMessage = {
      id: 'ai-loading-' + Date.now(),
      content: '',
      sender: 'ai',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, aiLoadingMsg]);

    // Track whether we're actively streaming a message
    let isActiveStreaming = false;
    // Track our current streaming message ID so we can update it
    let activeStreamingId = '';

    try {
      // Handle streaming tokens
      await sendStreamingMessage(
        username,
        content,
        (token) => {
          // If no active streaming message, create one
          if (!isActiveStreaming) {
            isActiveStreaming = true;
            // Create a new streaming message
            const streamMessage: ChatMessage = {
              id: `ai-streaming-${Date.now()}`,
              content: token, // Start with the first token
              sender: 'ai',
              timestamp: new Date(),
              messageType: 'text',
            };

            // Save the ID for later updates
            activeStreamingId = streamMessage.id;

            // Replace loading message with streaming message
            setMessages(prev => prev.map(msg =>
              msg.id === aiLoadingMsg.id ? streamMessage : msg
            ));
          } else {
            // Update the existing streaming message with new token
            setMessages(prev => prev.map(msg =>
              msg.id === activeStreamingId
                ? { ...msg, content: msg.content + token }
                : msg
            ));
          }

          // Scroll to new content
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        },
        (finalMessages) => {
          // This is called after each complete message OR at the end
          console.log('Message complete:', finalMessages);

          if (isActiveStreaming) {
            // Always finalize with the backend's full content to avoid truncation
            const newMsg: ChatMessage = {
              id: activeStreamingId,
              content: finalMessages[0].content, // Use backend's full message
              sender: 'ai',
              timestamp: new Date(),
              messageType: finalMessages[0].type || 'text',
            };

            setMessages(prev => prev.map(msg =>
              msg.id === activeStreamingId ? newMsg : msg
            ));

            // Reset streaming state for next message
            isActiveStreaming = false;
            activeStreamingId = '';

            // Add a new loading message for the next response (if any)
            const nextLoadingMsg: ChatMessage = {
              id: 'ai-loading-' + Date.now(),
              content: '',
              sender: 'ai',
              timestamp: new Date(),
              isLoading: true,
            };

            // Only add loading message if we're not at the end
            if (finalMessages[0].type !== 'final') {
              setMessages(prev => [...prev, nextLoadingMsg]);
              aiLoadingMsg.id = nextLoadingMsg.id;
            }
          } else {
            // If we're not actively streaming but received a finalMessage
            // This can happen if an error occurred or streaming ended abruptly
            const finalMsg: ChatMessage = {
              id: `ai-final-${Date.now()}`,
              content: finalMessages[0].content, // Use backend's full message
              sender: 'ai',
              timestamp: new Date(),
              messageType: finalMessages[0].type || 'text',
            };

            setMessages(prev => prev.map(msg =>
              msg.id === aiLoadingMsg.id ? finalMsg : msg
            ));
          }

          // Scroll to new content
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );
    } catch (error) {
      console.error('Error getting response:', error);
      // Replace loading message with error
      setMessages(prev => prev.map(msg =>
        msg.id === aiLoadingMsg.id
          ? { ...msg, content: 'Error getting response', isLoading: false }
          : msg
      ));
    } finally {
      setSending(false);

      // Final scroll to make sure the latest message is visible
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  };

  const handleClear = async () => {
    try {
      await clearConversationHistory(Number(userId));
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <ChatMessageComponent message={item} />
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
    >
      <SafeAreaView style={styles.container}>
        {/* Top controls */}
        <View style={styles.topRow}>
          {/* Clear button */}
          <TouchableOpacity style={styles.clearButtonTop} onPress={handleClear} disabled={sending}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Message list or default message */}
        {messages.length === 0 ? (
          <View style={styles.defaultMessageContainer}>
            <Text style={styles.defaultMessageText}>Start the conversation!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
          />
        )}

        {/* Chat input at the bottom, full width */}
        <View style={styles.inputRowFull}>
          <ChatInput onSend={handleSendMessage} disabled={sending} />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 0,
  },
  clearButtonTop: {
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 15,
  },
  messageList: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  inputRowFull: {
    width: '100%',
    paddingHorizontal: 0,
    paddingBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  defaultMessageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultMessageText: {
    color: '#8E8E93',
    fontSize: 16,
    fontStyle: 'italic',
  },
});

export default ChatScreen;
