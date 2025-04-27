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
import { sendMessage, getConversationHistory, clearConversationHistory } from '@services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';

// Default avatar for users without a profile picture
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

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
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatarSmall} />
          <Text style={styles.headerTitle}>{username}</Text>
        </View>
      ),
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
    if (!content.trim() || sending) return;
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
      content: '...',
      sender: 'ai',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, aiLoadingMsg]);

    try {
      const response = await sendMessage(username, content);
      // Replace the loading message with the real answer
      setMessages(prev => prev.map(msg =>
        msg.id === aiLoadingMsg.id
          ? {
              ...msg,
              content: response.answer,
              isLoading: false,
              timestamp: new Date(),
            }
          : msg
      ));
    } catch (error) {
      // Optionally show error in the loading message
      setMessages(prev => prev.map(msg =>
        msg.id === aiLoadingMsg.id
          ? { ...msg, content: 'Error getting response', isLoading: false }
          : msg
      ));
    } finally {
      setSending(false);
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
        {/* Clear button at the top right */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
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