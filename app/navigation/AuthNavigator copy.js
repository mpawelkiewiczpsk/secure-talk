import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterRequestScreen from '../screens/Auth/RegisterRequestScreen';
import TokenLoginScreen from '../screens/Auth/TokenLoginScreen';
import BiometricAuthScreen from '../screens/Auth/BiometricAuthScreen';
import { useAuth } from '../context/AuthContext';


const Stack = createNativeStackNavigator();

export default function AuthNavigator() {

  const { isAuthenticated, token } = useAuth();
  
  return (
    <Stack.Navigator>
      {!isAuthenticated && token !== null ? (<Stack.Screen
        name="BiometricAuth"
        component={BiometricAuthScreen}
        options={{ title: 'Biometryczna Autoryzacja' }}
      />):(<Stack.Screen
        name="RegisterRequest"
        component={RegisterRequestScreen}
        options={{ title: 'Rejestracja' }}
      />)

      }
    </Stack.Navigator>
  );
}
