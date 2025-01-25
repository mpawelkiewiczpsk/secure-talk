// app/navigation/RootNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import BiometricAuthScreen from '../screens/Auth/BiometricAuthScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isLoading, isAuthenticated, token } = useAuth();

  if (isLoading) {
    // Ekran ładowania / splash
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="MainNavigator" component={MainNavigator} />
        ) : token ? (
          // Mamy token, ale isAuthenticated = false -> Biometria
          <Stack.Screen name="BiometricAuth" component={BiometricAuthScreen} />
        ) : (
          // Brak tokenu -> AuthNavigator
          <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
