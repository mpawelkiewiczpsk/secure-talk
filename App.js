
import React, { useRef, useEffect } from 'react';
import { Platform, AppState, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import RootNavigator from './app/navigation/RootNavigator';
import WebApp from "./app/screens/Web/WebApp";

function AppInner() {
  const appState = useRef(AppState.currentState);
  const { logout } = useAuth();    // <-- teraz jestesmy W srodku providera
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (
        appState.current.match(/background|inactive/) &&
        nextAppState === 'active'
      ) {
        // Wywołaj biometrię:
        try {
          const authResult = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Zaloguj się biometrią',
          });

          if (authResult.success) {
            Alert.alert('Sukces', 'Zalogowano przy użyciu biometrii');
          } else {
            Alert.alert('Błąd biometrii', 'Nie udało się potwierdzić tożsamości.');
            logout(); // Wylogowanie – np. isAuthenticated = false
          }
        } catch (err) {
          console.log('Błąd autoryzacji biometrycznej:', err.message);
          Alert.alert('Błąd', err.message);
          logout();
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [logout]);

  return <RootNavigator />;
}

export default function App() {
  return (
    Platform.OS === 'web'
      ? <WebApp />
      : (
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      )
  );
}