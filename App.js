import React from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from './app/context/AuthContext';
import RootNavigator from './app/navigation/RootNavigator';
import WebApp from "./app/screens/Web/WebApp";

export default function App() {
  return (
    Platform.OS === 'web' ?
    <WebApp />
        :
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
