import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyToken } from '../../services/authService';

export default function TokenLoginScreen({ navigation }) {
  const [tokenInput, setTokenInput] = useState('');

  const handleTokenLogin = async () => {
    if (!tokenInput) {
      Alert.alert('Uwaga', 'Wpisz token');
      return;
    }
    try {
      const response = await verifyToken(tokenInput);
      if (response.valid) {
        await AsyncStorage.setItem('userToken', tokenInput);
        // Token jest poprawny -> przejście do ekranu biometrii
        navigation.navigate('BiometricAuth');
      } else {
        Alert.alert('Błąd', 'Token nieprawidłowy lub wygasł');
        await AsyncStorage.removeItem('userToken');
      }
    } catch (err) {
      console.log('Błąd weryfikacji tokenu:', err.message);
      await AsyncStorage.removeItem('userToken');
      // Komunikat błędu i tak jest w authService, więc tu można pominąć
    }
  };

  const handleRequestNewToken = () => {
    navigation.navigate('RegisterRequest');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Logowanie tokenem</Text>
      <TextInput
        style={styles.input}
        placeholder="Wprowadź token"
        value={tokenInput}
        onChangeText={setTokenInput}
      />
      <Button title="Zaloguj" onPress={handleTokenLogin} />
      <Button title="Zarejestruj się" onPress={handleRequestNewToken} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
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
