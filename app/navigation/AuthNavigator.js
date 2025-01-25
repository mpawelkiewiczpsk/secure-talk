// app/navigation/AuthNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterRequestScreen from '../screens/Auth/RegisterRequestScreen';
import TokenLoginScreen from '../screens/Auth/TokenLoginScreen';
import BiometricAuthScreen from '../screens/Auth/BiometricAuthScreen';


const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="RegisterRequest">
      <Stack.Screen
        name="RegisterRequest"
        component={RegisterRequestScreen}
        options={{ title: 'Rejestracja' }}
      />
      <Stack.Screen
        name="TokenLogin"
        component={TokenLoginScreen}
        options={{ title: 'Token Login' }}
      />
                <Stack.Screen name="BiometricAuth" component={BiometricAuthScreen} />
      
    </Stack.Navigator>
  );
}
