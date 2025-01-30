import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ChatService from "../../../services/chatService";
import MessageBubble from "../../../components/MessageBubble";
import * as AuthService from "../../../services/authService";

export default function GroupChatScreen({ route, navigation }) {
  const { groupId, groupUuid, groupName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchCurrentUserId = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userData = await AuthService.checkTokenValidity(token);
      if (!userData.valid) {
        throw new Error("Invalid token");
      }
      setCurrentUserId(userData.userData.id);
      console.log("Current User ID:", userData.userData.id);
    } catch (error) {
      console.error("Error fetching current user ID:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await ChatService.getGroupMessages(groupId);
      setMessages(data.messages);
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się pobrać wiadomości");
    }
  };

  useEffect(() => {
    fetchCurrentUserId();
    fetchMessages();
  }, [groupId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await ChatService.sendGroupMessage(groupId, newMessage);
      setNewMessage("");
      fetchMessages(); // Pobierz wiadomości po wysłaniu nowej wiadomości
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się wysłać wiadomości");
    }
  };

  const renderMessage = ({ item }) => (
    <MessageBubble message={item} currentUserId={currentUserId} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Napisz wiadomość"
        />
        <TouchableOpacity onPress={handleSendMessage}>
          <Text>Wyślij</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
  },
});