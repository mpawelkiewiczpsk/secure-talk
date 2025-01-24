import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { requestRegistration } from '../../services/authService';

const nameRegex = /^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+$/;
  const lastNameRegex = /^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+(?:[-' ][A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)*$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  const purposeRegex = /^[a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ ,.]+$/;

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

    if (!nameRegex.test(firstName)) {
      Alert.alert('Błąd', 'Imię jest niepoprawne. Użyj dużej litery na początku.');
      return;
    }
    if (!lastNameRegex.test(lastName)) {
      Alert.alert(
        'Błąd',
        'Nazwisko jest niepoprawne. Użyj dużej litery na początku i odpowiedniej składni (np. Nowak-Kowalski).'
      );
      return;
    }
    if (!emailRegex.test(email)) {
      Alert.alert('Błąd', 'Adres e-mail jest niepoprawny.');
      return;
    }
    if (purpose && !purposeRegex.test(purpose)) {
      Alert.alert(
        'Błąd',
        'Cel zgłoszenia zawiera niepoprawne znaki. Dozwolone są litery, cyfry, spacje, kropki i przecinki.'
      );
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
