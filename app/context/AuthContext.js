import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { checkTokenValidity } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Przy starcie aplikacji spróbujmy wczytać token z SecureStore
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        if (storedToken) {
          // Opcjonalnie: sprawdź ważność tokenu na serwerze
          const response = await checkTokenValidity(storedToken);
          if (response && response.valid) {
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            // Jeśli nieważny, usuń i pozostań niezalogowany
            await SecureStore.deleteItemAsync('userToken');
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.log('Błąd ładowania tokenu:', err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (newToken) => {
    setToken(newToken);
    setIsAuthenticated(true);
    await SecureStore.setItemAsync('userToken', newToken);
  };

  const logout = async () => {
    setToken(null);
    setIsAuthenticated(false);
    await SecureStore.deleteItemAsync('userToken');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
