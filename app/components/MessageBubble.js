import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MessageBubble({ message, currentUserId }) {
  console.log("Rendering message:", message);
  console.log("Current User ID:", currentUserId);
  const isOwnMessage = message.user_id === currentUserId;

  return (
    <View
      style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble,
      ]}
    >
      {}
      <Text
        style={[
          styles.senderName,
          isOwnMessage ? styles.ownSender : styles.otherSender,
        ]}
      >
        {message.sender_name}
      </Text>

      <Text style={[styles.text, { color: isOwnMessage ? "#fff" : "#000" }]}>
        {message.content}
      </Text>

      <Text
        style={[
          styles.timestamp,
          isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
        ]}
      >
        {new Date(message.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 15,
    padding: 10,
    marginVertical: 5,
    maxWidth: "80%",
  },
  ownBubble: {
    backgroundColor: "#25D366", 
    alignSelf: "flex-end",
  },
  otherBubble: {
    backgroundColor: "#0084FF", 
    alignSelf: "flex-start",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
  },
  ownSender: {
    color: "#fff",
  },
  otherSender: {
    color: "#fff",
  },
  text: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: "flex-end",
  },
  ownTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
  },
});
