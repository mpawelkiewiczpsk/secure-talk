import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ChatService from '../../../services/chatService';
import MessageBubble from '../../../components/MessageBubble';
import * as AuthService from '../../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatConversationScreen({ route, navigation }) {
  const { conversationId, userName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AuthService.checkTokenValidity(token);
        console.log('User Data:', userData); 
        if (!userData.valid) {
          throw new Error('Invalid token');
        }
        setCurrentUserId(userData.userData.id);
        console.log('Current User ID set to:', userData.userData.id); 
        
       
        const socketInstance = await ChatService.initializeSocket();
        setSocket(socketInstance);
  
        socketInstance.on('connect', () => {
          console.log('Socket connected');
          socketInstance.emit('join_conversation', { conversationId });
        });
  
        socketInstance.on('message', handleNewMessage);
        socketInstance.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
        });
  
       
        const fetchedMessages = await ChatService.getMessages(conversationId);
        console.log('Fetched Messages:', fetchedMessages); 
        setMessages(fetchedMessages.messages);
      } catch (err) {
        console.error('[Initialization error]', err);
        Alert.alert('Błąd', 'Nie udało się zainicjalizować czatu');
      } finally {
        setIsLoading(false);
      }
    };
  
    initialize();
  
    return () => {
      if (socket) {
        socket.off('message', handleNewMessage);
        socket.emit('leave_conversation', { conversationId });
        socket.disconnect();
      }
    };
  }, [conversationId]);

  const handleNewMessage = (newMsg) => {
    console.log('Received new message:', newMsg);
    setMessages((prev) => [newMsg, ...prev]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket) {
      console.log('sendMessage aborted: Empty message or no socket');
      return;
    }
    try {
      console.log('Sending:', conversationId, newMessage);
      const messageData = await ChatService.sendMessage(conversationId, newMessage);
  
     
      console.log('Received messageData:', messageData);
  
     
      const newMsg = {
        id: messageData.message_id,
        user_id: currentUserId, 
        sender_name: userName,
        content: messageData.content,
        timestamp: messageData.timestamp,
        conversation_id: messageData.conversation_id
      };
  
     
      console.log('New message object added:', newMsg);
  
      setMessages((prev) => [newMsg, ...prev]);
      setNewMessage('');
    } catch (err) {
      console.error('Sending message failed:', err);
      Alert.alert('Błąd', 'Nie udało się wysłać wiadomości');
    }
  };
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.messageList}
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            currentUserId={currentUserId}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        inverted={true}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Napisz wiadomość..."
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!newMessage.trim() || !socket}
        >
          <Ionicons
            name="send"
            size={24}
            color={newMessage.trim() && socket ? "#007AFF" : "#999"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 10,
    padding: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  }
});