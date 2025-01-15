import React from 'react';
import { AuthProvider } from './app/context/AuthContext';
import RootNavigator from './app/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
