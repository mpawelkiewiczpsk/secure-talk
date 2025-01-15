// app/screens/Main/Chat/NewChatScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';

export default function NewChatScreen({ navigation }) {
  const [chatName, setChatName] = useState('');

  const handleCreateChat = () => {
    if (!chatName.trim()) {
      Alert.alert('Błąd', 'Wpisz nazwę lub ID rozmówcy');
      return;
    }
    // W realnej aplikacji: wysyłamy info do backendu -> tworzymy konwersację
    // Na potrzeby demo: wróćmy do ChatListScreen
    Alert.alert('Nowy czat', `Utworzono rozmowę z: ${chatName}`);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Utwórz nową rozmowę</Text>
      <TextInput
        style={styles.input}
        placeholder="Nazwa czatu / ID rozmówcy"
        value={chatName}
        onChangeText={setChatName}
      />
      <Button title="Utwórz" onPress={handleCreateChat} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 10,
    borderRadius: 6,
  },
});
