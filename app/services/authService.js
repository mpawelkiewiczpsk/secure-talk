import { Alert } from 'react-native';

const API_URL = 'http://192.168.33.21:3000'; // Wstaw swój adres serwera

export async function requestRegistration(data) {
  try {
    const response = await fetch(`${API_URL}/register-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Błąd podczas rejestracji');
    }
    return await response.json(); // np. { message: 'Zarejestrowano' }
  } catch (err) {
    Alert.alert('Błąd', err.message);
    throw err;
  }
}

export async function verifyToken(token) {
  try {
    const response = await fetch(`${API_URL}/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token nieprawidłowy');
    }
    return await response.json(); // np. { valid: true, userData: {...} }
  } catch (err) {
    Alert.alert('Błąd', err.message);
    throw err;
  }
}

export async function checkTokenValidity(token) {
  try {
    const response = await fetch(`${API_URL}/check-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Błąd weryfikacji tokenu');
    }
    return await response.json(); // np. { valid: true, userData: {...} }
  } catch (err) {
    console.log('Błąd weryfikacji tokenu:', err.message);
    throw err;
  }
}
