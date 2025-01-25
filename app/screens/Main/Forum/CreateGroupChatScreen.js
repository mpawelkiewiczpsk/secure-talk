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

export default function CreateGroupChatScreen({ navigation }) {
  const [groupName, setGroupName] = useState("");

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Błąd", "Wprowadź nazwę grupy");
      return;
    }

    try {
      const response = await ChatService.createGroupChat(groupName);
      navigation.navigate("GroupChat", {
        groupId: response.group_id,
        groupUuid: response.group_uuid,
        groupName: groupName,
      });
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się utworzyć grupy");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nazwa grupy"
        value={groupName}
        onChangeText={setGroupName}
      />
      <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
        <Text style={styles.buttonText}>Utwórz grupę</Text>
        <Ionicons name="create" size={24} color="white" />
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
});
