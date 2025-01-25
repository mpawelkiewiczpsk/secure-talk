import { Alert } from "react-native";

const API_URL = "http://192.168.1.15:3000";

export async function requestRegistration(data) {
  try {
    const response = await fetch(`${API_URL}/register-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Błąd podczas rejestracji");
    }
    return await response.json();
  } catch (err) {
    Alert.alert("Błąd", err.message);
    throw err;
  }
}

export async function verifyToken(token) {
  try {
    const response = await fetch(`${API_URL}/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Token nieprawidłowy");
    }
    const result = await response.json();
    if (result.valid) {
      return result;
    } else {
      throw new Error("Token nieprawidłowy");
    }
  } catch (err) {
    Alert.alert("Błąd", err.message);
    throw err;
  }
}

export async function checkTokenValidity(token) {
  try {
    const response = await fetch(`${API_URL}/check-token`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Błąd weryfikacji tokenu");
    }
    return await response.json();
  } catch (err) {
    console.log("Błąd weryfikacji tokenu:", err.message);
    throw err;
  }
}
