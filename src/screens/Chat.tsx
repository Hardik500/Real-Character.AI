import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Text,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ChatMessage } from '@/types';
import ChatMessageComponent from '@components/ChatMessage';
import ChatInput from '@components/ChatInput';
import { sendMessage } from '@services/api';
import { useFocusEffect } from '@react-navigation/native';

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;

// Default avatar for users without a profile picture
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random';

const ChatScreen: React.FC<ChatScreenProps> = ({ route, navigation }) => {
  const { username, profilePicture } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);

  // Set up the navigation header
  useEffect(() => {
    const avatarUrl = profilePicture || `${DEFAULT_AVATAR}&name=${encodeURIComponent(username)}`;

    navigation.setOptions({
      title: username,
      headerBackVisible: true,
      headerTitleAlign: 'left',
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatarSmall} />
          <Text style={styles.headerTitle}>{username}</Text>
        </View>
      ),
    });
  }, [navigation, username, profilePicture]);

  // Scroll to the bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Add a welcome message when the chat opens
  useFocusEffect(
    React.useCallback(() => {
      if (messages.length === 0) {
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          content: `Hello! I'm ${username}'s AI personality. Ask me anything!`,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    }, [username, messages.length])
  );

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || sending) return;

    // Create a new user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    // Create a temporary loading message for the AI
    const tempAiMessage: ChatMessage = {
      id: `temp-${Date.now().toString()}`,
      content: '',
      sender: 'ai',
      timestamp: new Date(),
      isLoading: true,
    };

    // Add both messages to the state
    setMessages((prev) => [...prev, userMessage, tempAiMessage]);
    setSending(true);

    try {
      // Send the message to the backend
      const response = await sendMessage(username, content);

      // Create the real AI message to replace the loading one
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now().toString()}`,
        content: response.answer,
        sender: 'ai',
        timestamp: new Date(),
      };

      // Replace the temporary message with the real one
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === tempAiMessage.id ? aiMessage : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Replace the temporary message with an error message
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === tempAiMessage.id 
            ? {
                ...msg,
                content: 'Sorry, I could not process your message. Please try again.',
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <ChatMessageComponent message={item} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
      />
      <ChatInput onSend={handleSendMessage} disabled={sending} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  },
  avatarSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});

export default ChatScreen; 