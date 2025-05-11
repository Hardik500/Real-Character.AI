import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
// If you see a type error here, install the package and follow setup: https://react-native-documents.github.io/docs/install
import { pick } from '@react-native-documents/picker';
import { ingestData } from '@services/api';

const SOURCE_TYPES = [
  { label: 'Slack HAR', value: 'slack_har' },
  { label: 'WhatsApp', value: 'whatsapp' },
];

const emptyUser = () => ({ username: '', email: '', phone: '', description: '' });

const IngestScreen: React.FC = () => {
  const [sourceType, setSourceType] = useState('slack_har');
  const [primaryUser, setPrimaryUser] = useState(emptyUser());
  const [additionalUsers, setAdditionalUsers] = useState<any[]>([]);
  const [userMapping, setUserMapping] = useState('');
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickFile = async () => {
    try {
      const [res] = await pick();
      if (res && res.uri) {
        setFile(res);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick file.');
    }
  };

  const handleAddUser = () => {
    setAdditionalUsers([...additionalUsers, emptyUser()]);
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

  const handleSubmit = async () => {
    if (!file || !primaryUser.username) {
      Alert.alert('Error', 'Please select a file and enter primary user username.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Use fetch to get the blob from the file uri
      const fileBlob = await fetch(file.uri).then(r => r.blob());
      const response = await ingestData({
        source_type: sourceType,
        file: fileBlob,
        primary_user_info: primaryUser,
        additional_users: additionalUsers.filter(u => u.username),
        user_mapping: userMapping ? JSON.parse(userMapping) : undefined,
      });
      setResult(response);
      Alert.alert('Success', 'Ingestion complete!');
    } catch (e: any) {
      setResult(e?.response?.data || e?.message || 'Unknown error');
      Alert.alert('Error', 'Ingestion failed.');
    } finally {
      setLoading(false);
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
      <Text style={styles.label}>Additional Users</Text>
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
      <Text style={styles.label}>User Mapping (JSON)</Text>
      <TextInput
        style={[styles.input, { height: 60 }]}
        placeholder='{"U123": "alice", "U456": "bob"}'
        value={userMapping}
        onChangeText={setUserMapping}
        multiline
      />
      <Text style={styles.label}>Source File</Text>
      <Button title={file ? file.name || file.uri : 'Pick File'} onPress={pickFile} />
      <View style={{ height: 16 }} />
      <Button title={loading ? 'Submitting...' : 'Submit'} onPress={handleSubmit} disabled={loading} />
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
});

export default IngestScreen; 