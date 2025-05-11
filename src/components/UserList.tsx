import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, UserProfile } from '@/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

// Default avatar image for users without a profile picture
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random';

interface UserListProps {
  users: UserProfile[];
  refreshControl?: React.ReactElement<React.ComponentProps<typeof RefreshControl>>;
}

const UserList: React.FC<UserListProps> = ({ users, refreshControl }) => {
  const navigation = useNavigation<NavigationProp>();

  const handleUserPress = (user: UserProfile) => {
    navigation.navigate('Chat', {
      userId: String(user.id),
      username: user.username,
      profilePicture: user.profilePicture,
    });
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    // Generate avatar URL with the username
    const avatarUrl = item.profilePicture || 
      `${DEFAULT_AVATAR}&name=${encodeURIComponent(item.username)}`;
    
    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item)}>
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.description || 'Tap to start chatting'}
          </Text>
        </View>
        <Text style={styles.time}>
          {item.created_at ? 
            new Date(item.created_at).toLocaleDateString() : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  if (!users || users.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noUsersText}>No active users found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderUserItem}
      contentContainerStyle={styles.listContainer}
      refreshControl={refreshControl}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000000',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666666',
  },
  time: {
    fontSize: 12,
    color: '#666666',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
  noUsersText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
    fontWeight: '500',
  },
});

export default UserList; 