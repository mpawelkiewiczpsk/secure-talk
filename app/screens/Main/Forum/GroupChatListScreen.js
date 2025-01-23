import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ChatService from "../../../services/chatService";

export default function GroupChatListScreen({ navigation }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await ChatService.getGroupConversations();
        setGroups(data);
      } catch (error) {
        Alert.alert("Błąd", "Nie udało się pobrać list group");
      }
    };

    fetchGroups();
  }, []);

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() =>
        navigation.navigate("GroupChat", {
          groupId: item.id,
          groupUuid: item.uuid,
          groupName: item.name,
        })
      }
    >
      <Text style={styles.groupName}>{item.name}</Text>
      <Text style={styles.groupUuid}>UUID: {item.uuid}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGroupItem}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("CreateGroupChat")}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.actionButtonText}>Utwórz grupę</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("JoinGroupChat")}
        >
          <Ionicons name="enter" size={24} color="white" />
          <Text style={styles.actionButtonText}>Dołącz do grupy</Text>
        </TouchableOpacity>
      </View>
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
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  groupItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  groupName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  groupUuid: {
    fontSize: 12,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "bold",
  },
});
