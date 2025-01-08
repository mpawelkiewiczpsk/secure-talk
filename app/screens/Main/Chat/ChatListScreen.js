// app/screens/Main/Chat/ChatListScreen.js

import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, StyleSheet } from 'react-native';

export default function ChatListScreen({ navigation }) {
  // Przykładowe dane czatu
  const [conversations, setConversations] = useState([
    { id: '1', name: 'Jan Kowalski', lastMessage: 'Hej, co tam?' },
    { id: '2', name: 'Grupa B', lastMessage: 'Spotykamy się jutro?' },
  ]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() =>
        navigation.navigate('ChatConversation', { conversationId: item.id })
      }
    >
      <Text style={styles.chatName}>{item.name}</Text>
      <Text style={styles.lastMessage}>{item.lastMessage}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
      <View style={{ marginVertical: 10 }}>
        <Button
          title="Nowa rozmowa"
          onPress={() => navigation.navigate('NewChat')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  chatItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  lastMessage: {
    color: '#666',
  },
});
