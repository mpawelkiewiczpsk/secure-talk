import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import * as ChatService from '../../../services/chatService';

export default function ChatListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allUsers, unreadMessages] = await Promise.all([
          ChatService.getAllUsers(),
          ChatService.getUnreadMessagesCount()
        ]);
        setUsers(allUsers || []);
        setUnreadCounts(unreadMessages || {});
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Błąd', 'Nie udało się pobrać danych');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem} 
      onPress={() => {
        navigation.navigate('Chat', { userId: item.id });
        ChatService.markConversationAsRead(item.id);
      }}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        {unreadCounts[item.id] > 0 && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );
  const handleUserPress = async (recipientId) => {
    try {
      const result = await ChatService.createConversation(recipientId);
      navigation.navigate('ChatConversation', {
        conversationId: result.conversation_id,
        userName: '', 
      });
    } catch (error) {
      Alert.alert('Błąd', error.message);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Wybierz użytkownika do rozmowy</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Szukaj użytkowników..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleUserPress(item.id)}>
            <Text style={styles.itemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Brak wyników</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  container: {
    flex: 1, backgroundColor: '#f7f7f7', paddingHorizontal: 10, paddingTop: 10,
  },
  header: {
    fontSize: 18, fontWeight: '600', marginBottom: 10, color: '#333',
  },
  searchInput: {
    backgroundColor: '#fff', padding: 10, marginBottom: 10,
    borderRadius: 8, borderWidth: 1, borderColor: '#ccc',
  },
  item: {
    backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 15,
    borderBottomWidth: 1, borderBottomColor: '#ededed',
  },
  itemText: {
    fontSize: 16, color: '#333',
  },
  emptyText: {
    textAlign: 'center', color: '#888', marginTop: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginLeft: 8
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  }
});