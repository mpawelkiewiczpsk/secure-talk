import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Text, ScrollView, Button, Alert } from 'react-native';

// Adres Twojego backendu Flask/SocketIO
const API_URL = 'http://localhost:3000';
const ADMIN_TOKEN = '123';

export default function WebApp() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  // Pobranie listy użytkowników przy starcie
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const resp = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });

      if (resp.data.users) {
        setUsers(resp.data.users);
      } else {
        setMessage('Brak użytkowników lub błąd');
      }
    } catch (err) {
      console.error('Błąd pobierania użytkowników:', err.message);
      setMessage('Błąd pobierania użytkowników (sprawdź konsolę).');
    }
  };

  const handleGenerateToken = async (userId) => {
    try {
      const resp = await axios.put(`${API_URL}/generate-token/${userId}`, null, {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });

      const generatedToken = resp.data.token;
      if (generatedToken) {
        Alert.alert('Sukces', `Wygenerowano token: ${generatedToken}`);
        setMessage(`Token wygenerowany dla użytkownika #${userId}: ${generatedToken}`);
      } else {
        setMessage('Brak tokenu w odpowiedzi serwera.');
        console.error('Token nie został zwrócony przez backend:', resp.data);
      }

      // Odśwież listę użytkowników po wygenerowaniu tokenu
      await fetchUsers();
    } catch (err) {
      console.error('Błąd generowania tokenu:', err.message);
      setMessage('Nie udało się wygenerować tokenu.');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`${API_URL}/delete-user/${userId}`, {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });
      Alert.alert('Sukces', 'Pomyślnie usunięto użytkownika');
      setMessage('Użytkownik został pomyślnie usunięty');
      await fetchUsers();
    } catch (err) {
      console.error('Błąd usuwania użytkownika:', err.message);
      setMessage('Nie udało się usunąć użytkownika');
    }
  };

  const handleDeactivateUser = async (userId) => {
    try {
      await axios.put(`${API_URL}/deactivate-user/${userId}`, null, {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      });
      Alert.alert('Sukces', 'Pomyślnie dezaktywowano użytkownika');
      setMessage('Użytkownik został pomyślnie dezaktywowany');
      await fetchUsers();
    } catch (err) {
      console.error('Błąd dezaktywacji użytkownika:', err.message);
      setMessage('Nie udało się dezaktywować użytkownika');
    }
  }

  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Panel Administratora</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.refreshButton}>
          <Button title="Odśwież użytkowników" onPress={fetchUsers} />
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.headerCell}>ID</Text>
            <Text style={styles.headerCell}>Imię i nazwisko</Text>
            <Text style={styles.headerCell}>Czy aktywny?</Text>
            <Text style={styles.headerCell}>Generowanie tokenu</Text>
            <Text style={styles.headerCell}>Dezaktywowanie użytkownika</Text>
            <Text style={styles.headerCell}>Usuwanie użytkownika</Text>
          </View>

          {users.map((u) => (
            <View style={styles.tableRow} key={u.id}>
              <Text style={styles.tableCell}>{u.id}</Text>
              <Text style={styles.tableCell}>{u.name}</Text>
              <Text style={styles.tableCell}>{u.isActive}</Text>
              <View style={styles.actionCell}>
                <Button
                  title="Generuj token"
                  onPress={() => handleGenerateToken(u.id)}
                  color="#4caf50"
                />
              </View>
              <View style={styles.actionCell}>
                <Button
                  title="Dezaktywuj użytkownika"
                  onPress={() => handleDeactivateUser(u.id)}
                  color="#c62300"
                />
              </View>
              <View style={styles.actionCell}>
                <Button
                  title="Usuń użytkownika"
                  onPress={() => handleDeleteUser(u.id)}
                  color="#a50e0e"
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 16,
  },
  message: {
    fontSize: 16,
    color: '#ffeb3b',
    marginBottom: 12,
  },
  refreshButton: {
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  table: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tableHeader: {
    backgroundColor: '#3b5998',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
  },
  headerCell: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  actionCell: {
    flex: 1,
    alignItems: 'center',
  },
});
