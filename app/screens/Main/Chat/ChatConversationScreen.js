// app/screens/Main/Chat/ChatConversationScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';

export default function ChatConversationScreen({ route }) {
  const { conversationId } = route.params; // Przykładowo => "1" albo "2"
  const [messages, setMessages] = useState([
    // Przykładowe wiadomości
    { id: 'm1', text: 'Cześć, co słychać?', sender: 'Jan', timestamp: '10:00' },
    { id: 'm2', text: 'Hej! U mnie ok.', sender: 'Ty', timestamp: '10:01' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsgObj = {
      id: `m${Date.now()}`,
      text: newMessage,
      sender: 'Ty',
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMsgObj]);
    setNewMessage('');
  };

  const renderItem = ({ item }) => (
    <View style={[styles.messageBubble, 
      item.sender === 'Ty' ? styles.myMessage : styles.theirMessage]}>
      <Text style={styles.msgText}>{item.text}</Text>
      <Text style={styles.msgTimestamp}>{item.timestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Rozmowa #{conversationId}</Text>

      <FlatList
        style={styles.messagesList}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Napisz wiadomość..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <Button title="Wyślij" onPress={handleSendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 12,
    fontWeight: 'bold',
    fontSize: 16,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  messagesList: {
    flex: 1,
    padding: 8,
  },
  messageBubble: {
    marginVertical: 4,
    padding: 8,
    borderRadius: 8,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: '#eee',
    alignSelf: 'flex-start',
  },
  msgText: {
    fontSize: 14,
  },
  msgTimestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
});
