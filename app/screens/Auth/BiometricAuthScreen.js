import React, { useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../context/AuthContext';

export default function BiometricAuthScreen({ route, navigation }) {
  const { login } = useAuth();
  const { token } = route.params; // Przekazany z TokenLoginScreen

  useEffect(() => {
    handleBiometricAuth();
  }, []);

  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Brak biometrii', 'Urządzenie nie obsługuje biometrii.');
        // Zaloguj bez biometrii
        await login(token);
        navigation.replace('MainNavigator');
        return;
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Zaloguj się biometrią',
      });

      if (authResult.success) {
        // Zapisujemy token w SecureStore (poprzez login z AuthContext)
        await login(token);
        Alert.alert('Sukces', 'Zalogowano przy użyciu biometrii');
        navigation.replace('MainNavigator'); // Przejdź do ekranu głównego
      } else {
        Alert.alert('Błąd biometrii', 'Nie udało się potwierdzić tożsamości.');
        navigation.goBack();
      }
    } catch (err) {
      console.log('Błąd autoryzacji biometrycznej:', err.message);
      Alert.alert('Błąd', err.message);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Autoryzacja biometryczna</Text>
      <Button title="Spróbuj ponownie" onPress={handleBiometricAuth} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
});
