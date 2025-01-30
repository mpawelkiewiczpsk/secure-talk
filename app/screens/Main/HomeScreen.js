// app/screens/Main/HomeScreen.js

import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen({ navigation }) {
  const { deleteAccount } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Witaj w aplikacji Secure-Talk!</Text>
      <View style={styles.buttonWrapper}>
        <Button
          title="Przejdź do czatu"
          onPress={() => navigation.navigate("ChatList")}
        />
      </View>

      <View style={styles.buttonWrapper}>
        <Button
          title="Przejdź do czatu grupowego (forum)"
          onPress={() => navigation.navigate("GroupChatList")}
        />
      </View>

      <View style={styles.buttonWrapper}>
        <Button
          title="Wyloguj"
          onPress={() => deleteAccount()} // ustawia isAuthenticated = false
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  buttonWrapper: {
    marginVertical: 8,
    width: "80%",
  },
});
