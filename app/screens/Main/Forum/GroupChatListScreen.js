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
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(async () => {
          try {
            const unreadMessages = await ChatService.getUnreadGroupMessagesCount();
            setUnreadCounts(unreadMessages || {});
          } catch (error) {
            console.error('Error updating unread count:', error);
          }
        }, 1000);
  }, []);

  const fetchGroups = async () => {
    try {
      const [data, unreadMessages] = await Promise.all([
        ChatService.getGroupConversations(),
        ChatService.getUnreadGroupMessagesCount(),
      ]);
      setGroups(data);
      setUnreadCounts(unreadMessages || {});
    } catch (error) {
      Alert.alert("Błąd", "Nie udało się pobrać list group");
    }
  };

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
      <View style={styles.unreadContainer}>
        {unreadCounts[item.id] > 0 && (
          <>
            <Text style={styles.unreadText}>
              nieodczytane: {unreadCounts[item.id]}
            </Text>
            <View style={styles.unreadDot} />
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {groups.length === 0 ? (
        <Text style={styles.noGroupsText}>Brak dostępnych grup.</Text>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderGroupItem}
        />
      )}
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
  unreadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  unreadText: {
    fontSize: 12,
    color: "#666",
    marginRight: 5,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
  },
});

