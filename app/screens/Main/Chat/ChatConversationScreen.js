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
import { ChatService } from '../../../services/chatService';
import MessageBubble from '../../../components/MessageBubble';

export default function ChatConversationScreen({ route, navigation }) {
  const { conversationId, userName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: userName || 'Czat' });

    const initializeSocket = async () => {
      try {
        const socketInstance = await ChatService.initializeSocket();
        setSocket(socketInstance);
        
        socketInstance.on('message', handleNewMessage);
        socketInstance.emit('join_conversation', { conversationId });

        const previousMessages = await ChatService.getMessages(conversationId);
        setMessages(previousMessages);
      } catch (error) {
        Alert.alert('Błąd', 'Nie udało się połączyć z serwerem');
      }
    };

    initializeSocket();

    return () => {
      if (socket) {
        socket.off('message');
        socket.emit('leave_conversation', { conversationId });
      }
    };
  }, [conversationId, userName]);

  const handleNewMessage = (newMsg) => {
    setMessages(prev => [newMsg, ...prev]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket) return;
    try {
      await ChatService.sendMessage(conversationId, newMessage);
      setNewMessage('');
    } catch (err) {
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
        renderItem={({ item }) => <MessageBubble message={item} />}
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