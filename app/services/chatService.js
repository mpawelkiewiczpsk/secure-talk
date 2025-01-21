import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

const API_URL = 'http://10.0.0.2:3000';
const SOCKET_URL = 'http://10.0.0.2:3000';
const ENCRYPTION_KEY = 'your-encryption-key-here'; // Must be 256 bits (32 characters)

let socket = null;

const encrypt = (text) => {
  let iv = CryptoJS.lib.WordArray.random(16);
  let key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
  let encrypted = CryptoJS.AES.encrypt(text, key, { iv: iv }).toString();
  return iv.toString() + ':' + encrypted;
};

const decrypt = (text) => {
  let textParts = text.split(':');
  let iv = CryptoJS.enc.Hex.parse(textParts.shift());
  let encryptedText = textParts.join(':');
  let key = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
  let decrypted = CryptoJS.AES.decrypt(encryptedText, key, { iv: iv });
  return decrypted.toString(CryptoJS.enc.Utf8);
};

export const getConversations = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_URL}/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    const data = await response.json();
    return data.conversations; 
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
    const data = await response.json();
    data.messages = data.messages.map(message => ({
      ...message,
      content: decrypt(message.content)
    }));
    return data;
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
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create conversation');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const initializeSocket = async () => {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) throw new Error('No token found');

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

  socket.on('message', (data) => {
    const decryptedContent = decrypt(data.content);
    console.log('Received decrypted message:', decryptedContent);
    // Handle the decrypted content
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export const createMessage = async (conversationId, content) => {
  try {
    const encryptedContent = encrypt(content);
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: encryptedContent }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create message via endpoint');
    }

    const messageData = await response.json();
    console.log('Message created:', messageData); // Log the created message data
    
    return messageData;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
};

export const sendMessage = async (conversationId, content) => {
  const messageData = await createMessage(conversationId, content);

  if (!socket?.connected) {
    console.error('Socket not connected');
    throw new Error('Socket not connected');
  }
  const encryptedContent = encrypt(content);
  console.log('Emitting send_message:', { conversationId, content: encryptedContent }); // Log the data being emitted
  
  // Log the current date for reference
  const currentDate = new Date();
  console.log('Current date:', currentDate);

  // Additional log for message data
  console.log('Message data before emitting:', messageData);

  socket.emit('send_message', { conversationId, content: encryptedContent });

  return messageData;
};
