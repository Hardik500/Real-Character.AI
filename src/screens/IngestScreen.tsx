import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
// If you see a type error here, install the package and follow setup: https://react-native-documents.github.io/docs/install
import { pick, keepLocalCopy } from '@react-native-documents/picker';
import { ingestData, fetchUsers } from '@services/api';

const SOURCE_TYPES = [
  { label: 'Slack HAR', value: 'slack_har' },
  { label: 'WhatsApp', value: 'whatsapp' },
];

const USER_MODES = [
  { label: 'New User', value: 'new' },
  { label: 'Existing User', value: 'existing' },
];

const emptyUser = () => ({ username: '', email: '', phone: '', description: '' });

const IngestScreen: React.FC = () => {
  const [sourceType, setSourceType] = useState('slack_har');
  const [primaryUserMode, setPrimaryUserMode] = useState('new');
  const [additionalUserMode, setAdditionalUserMode] = useState('new');
  const [primaryUser, setPrimaryUser] = useState(emptyUser());
  const [additionalUsers, setAdditionalUsers] = useState<any[]>([]);
  const [userMappings, setUserMappings] = useState<{ sourceId: string; mappedName: string }[]>([]);
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [selectedExistingPrimaryUser, setSelectedExistingPrimaryUser] = useState<string>('');
  const [selectedExistingAdditionalUsers, setSelectedExistingAdditionalUsers] = useState<string[]>([]);

  useEffect(() => {
    loadExistingUsers();
  }, []);

  const loadExistingUsers = async () => {
    try {
      setFetchingUsers(true);
      const users = await fetchUsers();
      setExistingUsers(users);
    } catch (e) {
      Alert.alert('Error', 'Failed to load existing users.');
      console.error('Error loading users:', e);
    } finally {
      setFetchingUsers(false);
    }
  };

  const pickFile = async () => {
    try {
      const [res] = await pick();
      if (res && res.uri) {
        // Copy the file to a persistent location using the correct API
        const localCopies = await keepLocalCopy({ files: [{ uri: res.uri, fileName: res.name || 'file' }], destination: 'cachesDirectory' });
        let localUri = res.uri;
        if (localCopies[0]?.status === 'success' && localCopies[0].localUri) {
          localUri = localCopies[0].localUri;
        }
        setFile({
          ...res,
          uri: localUri,
        });
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick file.');
    }
  };

  const handleAddUser = () => {
    if (additionalUserMode === 'new') {
      setAdditionalUsers([...additionalUsers, emptyUser()]);
    }
  };

  const handleRemoveUser = (idx: number) => {
    setAdditionalUsers(additionalUsers.filter((_, i) => i !== idx));
  };

  const handleUserChange = (idx: number, field: string, value: string) => {
    setAdditionalUsers(
      additionalUsers.map((user, i) =>
        i === idx ? { ...user, [field]: value } : user
      )
    );
  };

  const handleAddMapping = () => {
    setUserMappings([...userMappings, { sourceId: '', mappedName: '' }]);
  };

  const handleRemoveMapping = (idx: number) => {
    setUserMappings(userMappings.filter((_, i) => i !== idx));
  };

  const handleMappingChange = (idx: number, field: 'sourceId' | 'mappedName', value: string) => {
    setUserMappings(
      userMappings.map((mapping, i) =>
        i === idx ? { ...mapping, [field]: value } : mapping
      )
    );
  };

  const toggleExistingAdditionalUser = (username: string) => {
    setSelectedExistingAdditionalUsers(prev => 
      prev.includes(username) 
        ? prev.filter(u => u !== username) 
        : [...prev, username]
    );
  };

  const clearSelectedPrimaryUser = () => {
    setSelectedExistingPrimaryUser('');
  };

  const clearSelectedAdditionalUsers = () => {
    setSelectedExistingAdditionalUsers([]);
  };

  const selectAllAdditionalUsers = () => {
    // Get all usernames except the primary user
    const allUsernames = existingUsers
      .filter(user => user.username !== selectedExistingPrimaryUser)
      .map(user => user.username);
    setSelectedExistingAdditionalUsers(allUsernames);
  };

  const handleSubmit = async () => {
    if (!file) {
      Alert.alert('Error', 'Please select a file.');
      return;
    }

    // Validate primary user info
    if (primaryUserMode === 'new' && !primaryUser.username) {
      Alert.alert('Error', 'Please enter primary user username.');
      return;
    } else if (primaryUserMode === 'existing' && !selectedExistingPrimaryUser) {
      Alert.alert('Error', 'Please select a primary user.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      // Build user_mapping object from userMappings array
      const user_mapping = userMappings.reduce((acc, curr) => {
        if (curr.sourceId && curr.mappedName) {
          acc[curr.sourceId] = curr.mappedName;
        }
        return acc;
      }, {} as Record<string, string>);
      
      // Use the file object directly for FormData
      const fileToSend = {
        uri: file.uri,
        name: file.name || 'upload',
        type: file.type || 'application/octet-stream',
      };

      // Determine the primary user info to send
      let primaryUserInfo;
      if (primaryUserMode === 'new') {
        primaryUserInfo = primaryUser;
      } else {
        // Find the selected user from existing users
        primaryUserInfo = existingUsers.find(u => u.username === selectedExistingPrimaryUser) || { username: selectedExistingPrimaryUser };
      }

      // Determine additional users to send
      let additionalUsersToSend = [];
      if (additionalUserMode === 'new') {
        additionalUsersToSend = additionalUsers.filter(u => u.username);
      } else {
        // Get full user objects for selected existing users
        additionalUsersToSend = existingUsers
          .filter(u => selectedExistingAdditionalUsers.includes(u.username))
          .map(u => ({ username: u.username, email: u.email, phone: u.phone, description: u.description }));
      }

      const response = await ingestData({
        source_type: sourceType,
        file: fileToSend,
        primary_user_info: primaryUserInfo,
        additional_users: additionalUsersToSend,
        user_mapping: Object.keys(user_mapping).length > 0 ? user_mapping : undefined,
      });
      setResult(response);
      Alert.alert('Success', 'Ingestion complete!');
    } catch (e: any) {
      console.error('Error:', e);
      setResult(e?.response?.data || e?.message || 'Unknown error');
      Alert.alert('Error', 'Ingestion failed.');
    } finally {
      setLoading(false);
    }
  };

  const renderPrimaryUserSection = () => {
    if (primaryUserMode === 'new') {
      return (
        <>
          <TextInput
            style={styles.input}
            placeholder="Username*"
            value={primaryUser.username}
            onChangeText={v => setPrimaryUser({ ...primaryUser, username: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={primaryUser.email}
            onChangeText={v => setPrimaryUser({ ...primaryUser, email: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={primaryUser.phone}
            onChangeText={v => setPrimaryUser({ ...primaryUser, phone: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={primaryUser.description}
            onChangeText={v => setPrimaryUser({ ...primaryUser, description: v })}
          />
        </>
      );
    } else {
      return (
        <View style={styles.userSelectionContainer}>
          <View style={styles.userSelectionHeader}>
            <Text style={styles.userSelectionTitle}>Select a user</Text>
            <View style={styles.userSelectionActions}>
              {selectedExistingPrimaryUser && (
                <TouchableOpacity onPress={clearSelectedPrimaryUser} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={loadExistingUsers} style={styles.refreshButton}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
          {fetchingUsers ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : existingUsers.length === 0 ? (
            <Text style={styles.noUsersText}>No existing users found</Text>
          ) : (
            <ScrollView style={styles.userSelectionList}>
              {existingUsers.map(user => (
                <TouchableOpacity
                  key={user.username}
                  style={[
                    styles.userSelectionItem,
                    selectedExistingPrimaryUser === user.username && styles.userSelectionItemSelected
                  ]}
                  onPress={() => setSelectedExistingPrimaryUser(user.username)}
                >
                  <Text style={selectedExistingPrimaryUser === user.username ? styles.userSelectionTextSelected : styles.userSelectionText}>
                    {user.username} {user.email ? `(${user.email})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      );
    }
  };

  const renderAdditionalUsersSection = () => {
    if (additionalUserMode === 'new') {
      return (
        <>
          {additionalUsers.map((user, idx) => (
            <View key={idx} style={styles.additionalUserRow}>
              <TextInput
                style={styles.input}
                placeholder="Username*"
                value={user.username}
                onChangeText={v => handleUserChange(idx, 'username', v)}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={user.email}
                onChangeText={v => handleUserChange(idx, 'email', v)}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={user.phone}
                onChangeText={v => handleUserChange(idx, 'phone', v)}
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={user.description}
                onChangeText={v => handleUserChange(idx, 'description', v)}
              />
              <TouchableOpacity onPress={() => handleRemoveUser(idx)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <Button title="Add Additional User" onPress={handleAddUser} />
        </>
      );
    } else {
      const filteredUsers = existingUsers.filter(user => user.username !== selectedExistingPrimaryUser);
      const hasFilteredUsers = filteredUsers.length > 0;
      const allSelected = hasFilteredUsers && filteredUsers.every(user => 
        selectedExistingAdditionalUsers.includes(user.username)
      );

      return (
        <View style={styles.userSelectionContainer}>
          <View style={styles.userSelectionHeader}>
            <View style={styles.userSelectionTitleContainer}>
              <Text style={styles.userSelectionTitle}>Select multiple users</Text>
              {selectedExistingAdditionalUsers.length > 0 && (
                <Text style={styles.selectedCountText}>
                  {selectedExistingAdditionalUsers.length} selected
                </Text>
              )}
            </View>
            <View style={styles.userSelectionActions}>
              {hasFilteredUsers && !allSelected && (
                <TouchableOpacity onPress={selectAllAdditionalUsers} style={styles.selectAllButton}>
                  <Text style={styles.selectAllButtonText}>Select All</Text>
                </TouchableOpacity>
              )}
              {selectedExistingAdditionalUsers.length > 0 && (
                <TouchableOpacity onPress={clearSelectedAdditionalUsers} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={loadExistingUsers} style={styles.refreshButton}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          </View>
          {fetchingUsers ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : existingUsers.length === 0 ? (
            <Text style={styles.noUsersText}>No existing users found</Text>
          ) : filteredUsers.length === 0 ? (
            <Text style={styles.noUsersText}>No other users available</Text>
          ) : (
            <ScrollView style={styles.userSelectionList}>
              {filteredUsers.map(user => (
                <TouchableOpacity
                  key={user.username}
                  style={[
                    styles.userSelectionItem,
                    selectedExistingAdditionalUsers.includes(user.username) && styles.userSelectionItemSelected
                  ]}
                  onPress={() => toggleExistingAdditionalUser(user.username)}
                >
                  <Text style={selectedExistingAdditionalUsers.includes(user.username) ? styles.userSelectionTextSelected : styles.userSelectionText}>
                    {user.username} {user.email ? `(${user.email})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add User</Text>
      <Text style={styles.label}>Source Type</Text>
      <View style={styles.row}>
        {SOURCE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[styles.chip, sourceType === type.value && styles.chipSelected]}
            onPress={() => setSourceType(type.value)}
          >
            <Text style={sourceType === type.value ? styles.chipTextSelected : styles.chipText}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Primary User</Text>
      <View style={styles.row}>
        {USER_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[styles.chip, primaryUserMode === mode.value && styles.chipSelected]}
            onPress={() => setPrimaryUserMode(mode.value)}
          >
            <Text style={primaryUserMode === mode.value ? styles.chipTextSelected : styles.chipText}>{mode.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {renderPrimaryUserSection()}

      <Text style={styles.label}>Additional Users</Text>
      <View style={styles.row}>
        {USER_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[styles.chip, additionalUserMode === mode.value && styles.chipSelected]}
            onPress={() => setAdditionalUserMode(mode.value)}
          >
            <Text style={additionalUserMode === mode.value ? styles.chipTextSelected : styles.chipText}>{mode.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {renderAdditionalUsersSection()}

      <Text style={styles.label}>User Mapping</Text>
      {userMappings.map((mapping, idx) => (
        <View key={idx} style={styles.mappingRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 4 }]}
            placeholder="Source User ID (e.g. U123)"
            value={mapping.sourceId}
            onChangeText={v => handleMappingChange(idx, 'sourceId', v)}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 4 }]}
            placeholder="Mapped Username (e.g. alice)"
            value={mapping.mappedName}
            onChangeText={v => handleMappingChange(idx, 'mappedName', v)}
          />
          <TouchableOpacity onPress={() => handleRemoveMapping(idx)} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Button title="Add User Mapping" onPress={handleAddMapping} />
      <Text style={styles.label}>Source File</Text>
      <Button title={file ? file.name || file.uri : 'Pick File'} onPress={pickFile} />
      <View style={{ height: 16 }} />
      <Button title={loading ? 'Submitting...' : 'Submit'} onPress={handleSubmit} />
      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text selectable>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    color: '#007AFF',
  },
  chipTextSelected: {
    color: '#fff',
  },
  additionalUserRow: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  removeBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  removeBtnText: {
    color: 'red',
  },
  resultBox: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userSelectionContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    maxHeight: 250,
  },
  userSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  userSelectionTitle: {
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 4,
    backgroundColor: '#e6f2ff',
    borderRadius: 4,
  },
  refreshButtonText: {
    color: '#007AFF',
    fontSize: 12,
  },
  userSelectionItem: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userSelectionItemSelected: {
    backgroundColor: '#e6f2ff',
    borderColor: '#007AFF',
  },
  userSelectionText: {
    color: '#333',
  },
  userSelectionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  noUsersText: {
    padding: 8,
    fontStyle: 'italic',
    color: '#666',
  },
  userSelectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 8,
    padding: 4,
    backgroundColor: '#ffdde5',
    borderRadius: 4,
  },
  clearButtonText: {
    color: '#ff3b5c',
    fontSize: 12,
  },
  selectAllButton: {
    marginRight: 8,
    padding: 4,
    backgroundColor: '#d9f7e6',
    borderRadius: 4,
  },
  selectAllButtonText: {
    color: '#00a651',
    fontSize: 12,
  },
  userSelectionList: {
    maxHeight: 180,
  },
  userSelectionTitleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  selectedCountText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default IngestScreen; 