// app/navigation/RootNavigator.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Importy do naszych navigatorów
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Opcjonalnie zwróć ekran ładowania, np. splash screen
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Jeśli jesteśmy zalogowani, idziemy do "MainNavigator"
          <Stack.Screen name="MainNavigator" component={MainNavigator} />
        ) : (
          // Jeśli NIE jesteśmy zalogowani, idziemy do "AuthNavigator" (ekrany rejestracji, tokenu)
          <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
