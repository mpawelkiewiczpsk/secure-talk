// app/screens/Main/HomeScreen.js

import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Witaj w aplikacji Secure-Talk!</Text>
      <Button
        title="Przejdź do czatu"
        onPress={() => navigation.navigate('ChatList')} 
      />
      <Button
        title="Wyloguj"
        onPress={() => logout()} // ustawia isAuthenticated = false
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
  },
});
