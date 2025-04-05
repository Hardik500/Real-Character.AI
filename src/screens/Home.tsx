import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  Image, 
  useColorScheme 
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types/index';

// Sample data for AI generated content
const SAMPLE_CONTENT = [
  {
    id: '1',
    creator: {
      id: 'user1',
      username: 'ai_enthusiast',
      displayName: 'AI Enthusiast',
      profilePicture: 'https://via.placeholder.com/50',
      joined: new Date('2024-01-01'),
    },
    prompt: 'Create a futuristic cityscape with flying cars',
    generatedContent: 'A stunning image of a futuristic city with flying vehicles.',
    contentType: 'image',
    createdAt: new Date('2023-04-01'),
    likes: 128,
    comments: 42,
    shares: 18,
  },
  {
    id: '2',
    creator: {
      id: 'user2',
      username: 'prompt_master',
      displayName: 'Prompt Master',
      profilePicture: 'https://via.placeholder.com/50',
      joined: new Date('2024-02-15'),
    },
    prompt: 'Write a short poem about artificial intelligence',
    generatedContent: 'Silicon thoughts and digital dreams,\nAI learns from what it gleans.\nIn data seas, it finds its way,\nEvolving smarter day by day.',
    contentType: 'text',
    createdAt: new Date('2023-04-02'),
    likes: 75,
    comments: 16,
    shares: 5,
  },
];

type HomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeProps> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';

  const renderItem = ({ item }: any) => (
    <Pressable 
      style={styles.contentCard}
      onPress={() => navigation.navigate('ContentDetail', { contentId: item.id })}
    >
      <View style={styles.contentHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: item.creator.profilePicture }} 
            style={styles.profilePic} 
          />
          <View>
            <Text style={[styles.displayName, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {item.creator.displayName}
            </Text>
            <Text style={styles.username}>@{item.creator.username}</Text>
          </View>
        </View>
        <Text style={styles.timestamp}>
          {item.createdAt.toDateString()}
        </Text>
      </View>
      
      <View style={styles.promptContainer}>
        <Text style={[styles.promptLabel, { color: isDarkMode ? '#ffffff' : '#000000' }]}>Prompt:</Text>
        <Text style={[styles.promptText, { color: isDarkMode ? '#e0e0e0' : '#333333' }]}>
          {item.prompt}
        </Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.contentText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          {item.generatedContent}
        </Text>
        {item.contentType === 'image' && (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Image Preview</Text>
          </View>
        )}
      </View>
      
      <View style={styles.interactionBar}>
        <Text style={styles.interactionText}>❤️ {item.likes}</Text>
        <Text style={styles.interactionText}>💬 {item.comments}</Text>
        <Text style={styles.interactionText}>🔄 {item.shares}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f8f8f8' }]}>
      <FlatList 
        data={SAMPLE_CONTENT}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.contentList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              AI-Generated Content Feed
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#bbbbbb' : '#666666' }]}>
              Discover amazing AI creations from our community
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              No content to display yet. Stay tuned!
            </Text>
          </View>
        }
      />
      <Pressable 
        style={styles.createButton}
        onPress={() => {
          // Will be implemented when we add the CreateContent screen
          console.log('Create new content');
        }}
      >
        <Text style={styles.createButtonText}>+</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  contentList: {
    padding: 12,
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  displayName: {
    fontWeight: '600',
    fontSize: 15,
  },
  username: {
    fontSize: 13,
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  promptContainer: {
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  promptLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  contentContainer: {
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 22,
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#e1e1e1',
    borderRadius: 8,
    marginTop: 12,
