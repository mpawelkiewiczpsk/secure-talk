import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { checkTokenValidity } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        if (storedToken) {
          // Sprawdzamy ważność w backendzie
          const response = await checkTokenValidity(storedToken);
          if (response && response.valid) {
            // Token jest wciąż ważny
            setToken(storedToken);
            // Nie ustawiamy isAuthenticated = true,
            // bo chcemy wymusić logowanie biometrią (LocalAuth).
            setIsAuthenticated(false);
          } else {
            // Token nieważny => usuwamy go
            await SecureStore.deleteItemAsync('userToken');
            setToken(null);
            setIsAuthenticated(false);
          }
        } else {
          // Brak tokenu
          setToken(null);
          setIsAuthenticated(false);
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

  /**
   * "Wylogowanie" – ale nie usuwamy tokenu. 
   * Chcemy, by user wciąż mógł się zalogować np. biometrią.
   */
  const logout = async () => {
    setIsAuthenticated(false);
    // Nie usuwamy tokenu z SecureStore
    // W razie potrzeby można dodać "tymczasowe" info w SecureStore, 
    // że user jest "wylogowany" – zależnie od logiki.
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        setToken,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
