import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { ChatService } from '../services/chatService';

export default function NewChat({ onChatCreated }) {
  const [recipientToken, setRecipientToken] = useState('');

  const handleCreateChat = async () => {
    try {
      const response = await ChatService.createConversation(recipientToken);
      onChatCreated(response.conversation_id);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Wprowadź token odbiorcy..."
        value={recipientToken}
        onChangeText={setRecipientToken}
        style={styles.input}
      />
      <Button title="Utwórz konwersację" onPress={handleCreateChat} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 16,
  },
});