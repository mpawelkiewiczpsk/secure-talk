import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";

const API_URL = "https://3409-5-173-29-33.ngrok-free.app";
const SOCKET_URL = "https://3409-5-173-29-33.ngrok-free.app";
const AES_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;
let socket = null;

export const encrypt = (text) => {
  let iv = CryptoJS.lib.WordArray.random(16);
  let key = CryptoJS.enc.Utf8.parse(AES_KEY);
  let encrypted = CryptoJS.AES.encrypt(text, key, { iv: iv }).toString();
  return iv.toString(CryptoJS.enc.Base64) + ":" + encrypted;
};

export const decrypt = (text) => {
  let textParts = text.split(":");
  if (textParts.length !== 2) {
    throw new Error("Invalid encrypted text format");
  }
  let iv = CryptoJS.enc.Base64.parse(textParts.shift());
  let encryptedText = textParts.join(":");
  let key = CryptoJS.enc.Utf8.parse(AES_KEY);
  let decrypted = CryptoJS.AES.decrypt(encryptedText, key, { iv: iv });
  return decrypted.toString(CryptoJS.enc.Utf8);
};

export const markConversationAsRead = async (conversationId) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(
      `${API_URL}/conversations/${conversationId}/messages/read`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to mark messages as read");
    return await response.json();
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
};

export const getUnreadMessagesCount = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(`${API_URL}/unread-messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch unread messages");
    const data = await response.json();
    return data.unreadCounts;
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    throw error;
  }
};

export const getConversations = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(`${API_URL}/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch conversations");
    const data = await response.json();
    return data.conversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(`${API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getMessages = async (conversationId) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(
      `${API_URL}/conversations/${conversationId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch messages");
    const data = await response.json();
    data.messages = data.messages.map((message) => ({
      ...message,
      content: decrypt(message.content),
    }));
    return data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const createConversation = async (recipientId) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(`${API_URL}/conversations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: recipientId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create conversation");
    }
    // e.g. { conversation_id: ..., message: "Nowa konwersacja utworzona" }
    return await response.json();
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

export const initializeSocket = async () => {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No token found");

  socket = io(SOCKET_URL, {
    query: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("message", (data) => {
    const decryptedContent = decrypt(data.content);
    console.log("Received decrypted message:", decryptedContent);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

const ensureSocketConnected = async () => {
  if (!socket || !socket.connected) {
    await initializeSocket();
  }
};

export const createMessage = async (conversationId, content) => {
  try {
    const encryptedContent = encrypt(content);
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(
      `${API_URL}/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: encryptedContent }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to create message via endpoint"
      );
    }

    const messageData = await response.json();
    console.log("Message created:", messageData);

    return messageData;
  } catch (error) {
    console.error("Error creating message:", error);
    throw error;
  }
};

export const sendMessage = async (conversationId, content) => {
  await ensureSocketConnected();
  const messageData = await createMessage(conversationId, content);

  if (!socket?.connected) {
    console.error("Socket not connected");
    throw new Error("Socket not connected");
  }
  const encryptedContent = encrypt(content);
  console.log("Emitting send_message:", {
    conversationId,
    content: encryptedContent,
  });

  socket.emit("send_message", { conversationId, content: encryptedContent });

  return messageData;
};

export const createGroupChat = async (groupName) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(`${API_URL}/create-group-chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ group_name: groupName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create group chat");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating group chat:", error);
    throw error;
  }
};

export const joinGroupChat = async (groupUuid) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(`${API_URL}/join-group-chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ group_uuid: groupUuid }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to join group chat");
    }

    return await response.json();
  } catch (error) {
    console.error("Error joining group chat:", error);
    throw error;
  }
};

export const getGroupConversations = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(`${API_URL}/group-conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to fetch group conversations"
      );
    }

    const data = await response.json();
    return data.group_conversations;
  } catch (error) {
    console.error("Error fetching group conversations:", error);
    throw error;
  }
};

export const getGroupMessages = async (groupId) => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(
      `${API_URL}/group-conversations/${groupId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch group messages");
    }

    const data = await response.json();
    data.messages = data.messages.map((message) => ({
      ...message,
      content: decrypt(message.content),
    }));
    return data;
  } catch (error) {
    console.error("Error fetching group messages:", error);
    throw error;
  }
};

export const sendGroupMessage = async (groupId, content) => {
  await ensureSocketConnected();
  try {
    const encryptedContent = encrypt(content);
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(
      `${API_URL}/group-conversations/${groupId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: encryptedContent }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send group message");
    }

    const messageData = await response.json();

    if (!socket?.connected) {
      console.error("Socket not connected");
      throw new Error("Socket not connected");
    }

    socket.emit("send_group_message", {
      group_conversation_id: groupId,
      content: encryptedContent,
    });

    return messageData;
  } catch (error) {
    console.error("Error sending group message:", error);
    throw error;
  }
};

export const getUnreadGroupMessagesCount = async () => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    const response = await fetch(
      `${API_URL}/group-conversations/unread-messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch unread messages");
    const data = await response.json();
    return data.unreadCounts;
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    throw error;
  }
};