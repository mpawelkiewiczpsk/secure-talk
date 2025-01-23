import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { requestRegistration } from '../../services/authService';

export default function RegisterRequestScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('');

  const handleRegisterRequest = async () => {
    // Prosta walidacja
    if (!firstName || !lastName || !email) {
      Alert.alert('Uwaga', 'Wypełnij wszystkie wymagane pola');
      return;
    }
    try {
      // Zwróć uwagę: klucze muszą pasować do tego, co serwer odczytuje:
      const data = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        purpose: purpose,  // pole opcjonalne
      };
      await requestRegistration(data);

      Alert.alert(
        'Dziękujemy!',
        'Zgłoszenie zostało wysłane. Oczekuj na token od administratora.'
      );
      // Przejście do ekranu logowania tokenem
      navigation.navigate('TokenLogin');
    } catch (err) {
      console.log('Błąd rejestracji:', err.message);
      Alert.alert('Błąd', 'Wystąpił problem podczas rejestracji.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zgłoszenie rejestracji</Text>
      <TextInput
        style={styles.input}
        placeholder="Imię"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Nazwisko"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Cel użycia aplikacji (opcjonalnie)"
        value={purpose}
        onChangeText={setPurpose}
      />
      <Button title="Wyślij zgłoszenie" onPress={handleRegisterRequest} />
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
