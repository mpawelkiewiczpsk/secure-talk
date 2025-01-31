import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text, // Dodaj import Text
} from "react-native";
import * as ChatService from "../../../services/chatService";
import MessageBubble from "../../../components/MessageBubble";
import * as AuthService from "../../../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function GroupChatScreen({ route, navigation }) {
  const { groupId, groupUuid, groupName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  const fetchCurrentUserId = async () => {
    const token = await AsyncStorage.getItem("userToken");
    const userData = await AuthService.checkTokenValidity(token);
    if (!userData.valid) {
      throw new Error("Invalid token");
    }
  
      setCurrentUserId(userData.userData.id);
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
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się wysłać wiadomości");
    }
  };
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
          fetchMessages();
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [groupId]);

  // const renderMessage = ({ item }) => (
  //   <MessageBubble message={item} currentUserId={currentUserId} />
  // );

  return (
    <View style={styles.container}>
      {/* <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
      /> */}
            <FlatList
        style={styles.messageList}
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble message={item} currentUserId={currentUserId} />
        )}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : `temp-${index}`)}
        inverted={true}
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