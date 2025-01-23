import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import { Ionicons } from "@expo/vector-icons";
import * as ChatService from "../../../services/chatService";
import { useFocusEffect } from "@react-navigation/native";

export default function ChatListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "individual", title: "Rozmowy" },
    { key: "group", title: "Grupy" },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allUsers, unreadMessages, groupData] = await Promise.all([
          ChatService.getAllUsers(),
          ChatService.getUnreadMessagesCount(),
          ChatService.getGroupConversations(),
        ]);
        setUsers(allUsers || []);
        setGroups(groupData || []);
        setUnreadCounts(unreadMessages || {});
      } catch (error) {
        console.error("Error:", error);
        Alert.alert("Błąd", "Nie udało się pobrać danych");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchUnreadCounts = async () => {
        try {
          await ChatService.getUnreadMessagesCount();
        } catch (error) {
          console.error("Error updating unread count:", error);
        }
      };

      fetchUnreadCounts();
    }, [])
  );

  const handleUserPress = async (recipientId) => {
    try {
      const result = await ChatService.createConversation(recipientId);
      navigation.navigate("ChatConversation", {
        conversationId: result.conversation_id,
        userName: "",
      });
    } catch (error) {
      Alert.alert("Błąd", error.message);
    }
  };

  const handleGroupPress = (groupId, groupUuid, groupName) => {
    navigation.navigate("GroupChat", {
      groupId: groupId,
      groupUuid: groupUuid,
      groupName: groupName,
    });
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const IndividualChatRoute = () => (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Szukaj użytkowników..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleUserPress(item.id)}
          >
            <View style={styles.userInfo}>
              <Text style={styles.itemText}>{item.name}</Text>
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
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Brak wyników</Text>}
      />
    </View>
  );

  const GroupChatRoute = () => (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleGroupPress(item.id, item.uuid, item.name)}
          >
            <View style={styles.userInfo}>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.groupUuid}>UUID: {item.uuid}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Brak grup</Text>}
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

  const renderScene = SceneMap({
    individual: IndividualChatRoute,
    group: GroupChatRoute,
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: Dimensions.get("window").width }}
      renderTabBar={(props) => (
        <TabBar
          {...props}
          style={styles.tabBar}
          labelStyle={styles.tabLabel}
          indicatorStyle={styles.tabIndicator}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  tabBar: {
    backgroundColor: "#fff",
  },
  tabLabel: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  tabIndicator: {
    backgroundColor: "#007AFF",
  },
  header: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  searchInput: {
    backgroundColor: "#fff",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  item: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ededed",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 10,
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
  groupUuid: {
    fontSize: 12,
    color: "#666",
  },
});
