import React, { useState } from 'react';
import { 
  View, TextInput, TouchableOpacity, 
  StyleSheet, Text, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { initializeSocket } from '../../../services/chatService';

export default function NewChatScreen({ navigation }) {
  const [recipientId, setRecipientId] = useState('');

  const handleStartChat = async () => {
    if (!recipientId.trim()) {
      Alert.alert('Błąd', 'Wprowadź ID użytkownika');
      return;
    }

    try {
      const socket = await initializeSocket();
      socket.emit('start_conversation', { recipientId });
      navigation.navigate('ChatConversation', {
        conversationId: recipientId,
        userName: 'Nowa rozmowa'
      });
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się rozpocząć rozmowy');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Wprowadź ID użytkownika"
          value={recipientId}
          onChangeText={setRecipientId}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.startButton}
        onPress={handleStartChat}
      >
        <Text style={styles.buttonText}>Rozpocznij rozmowę</Text>
        <Ionicons name="arrow-forward" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  startButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});