import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  TextInput, StyleSheet, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initializeSocket } from '../../../services/chatService';

export default function ChatListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let socket;
    
    const setupSocket = async () => {
      socket = await initializeSocket();
      
      socket.on('message', (data) => {
        setConversations(prev => {
          const updated = [...prev];
          const conversationIndex = updated.findIndex(
            conv => conv.id === data.sender.user_id
          );
          
          if (conversationIndex !== -1) {
            updated[conversationIndex].lastMessage = data.content;
            updated[conversationIndex].timestamp = new Date().toLocaleTimeString();
            updated[conversationIndex].unread = true;
          } else {
            updated.push({
              id: data.sender.user_id,
              name: data.sender.name,
              lastMessage: data.content,
              timestamp: new Date().toLocaleTimeString(),
              unread: true
            });
          }
          return updated;
        });
        setUnreadCount(prev => prev + 1);
      });

      socket.on('user_connected', (data) => {
        console.log('User connected:', data.user.name);
      });

      setLoading(false);
    };

    setupSocket();
    return () => socket?.disconnect();
  }, []);

  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => {
        if (item.unread) {
          setUnreadCount(prev => prev - 1);
          setConversations(prev =>
            prev.map(conv =>
              conv.id === item.id ? { ...conv, unread: false } : conv
            )
          );
        }
        navigation.navigate('ChatConversation', { 
          conversationId: item.id,
          userName: item.name 
        });
      }}
    >
      <View style={styles.chatItemContent}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
      <View style={styles.messageContainer}>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
        {item.unread && <View style={styles.unreadBadge} />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Szukaj w rozmowach..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => navigation.navigate('NewChat')}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>

      {unreadCount > 0 && (
        <View style={styles.unreadCountBadge}>
          <Text style={styles.unreadCountText}>{unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  chatItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chatItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    color: '#666',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginLeft: 10,
  },
  newChatButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  unreadCountBadge: {
    position: 'absolute',
    right: 15,
    top: 15,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});