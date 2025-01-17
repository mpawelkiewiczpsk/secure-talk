import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.100.6.127:3000';
const SOCKET_URL = 'http://10.100.6.127:3000';
let socket = null;

export const getConversations = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_URL}/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return await response.json();
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const getMessages = async (conversationId) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const createConversation = async (recipientToken) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ recipient_token: recipientToken })
    });
    if (!response.ok) throw new Error('Failed to create conversation');
    return await response.json();
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const initializeSocket = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      throw new Error('No token found');
    }

    socket = io(SOCKET_URL, {
      query: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return socket;
  } catch (error) {
    console.error('Socket initialization error:', error);
    throw error;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export const sendMessage = async (conversationId, content) => {
  if (!socket?.connected) {
    throw new Error('Socket not connected');
  }

  socket.emit('send_message', {
    conversationId,
    content
  });
};