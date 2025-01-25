import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import * as ChatService from "../../../services/chatService";

export default function JoinGroupChatScreen({ navigation }) {
  const [groupUuid, setGroupUuid] = useState("");

  const handleJoinGroup = async () => {
    if (!groupUuid.trim()) {
      Alert.alert("Błąd", "Wprowadź UUID grupy");
      return;
    }

    try {
      const response = await ChatService.joinGroupChat(groupUuid);
      navigation.navigate("GroupChat", {
        groupId: response.group_id,
        groupUuid: groupUuid,
      });
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się dołączyć do grupy");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="UUID grupy"
        value={groupUuid}
        onChangeText={setGroupUuid}
      />
      <TouchableOpacity style={styles.joinButton} onPress={handleJoinGroup}>
        <Text style={styles.buttonText}>Dołącz do grupy</Text>
        <Ionicons name="enter" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
  },
  joinButton: {
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
  },
});
