// app/navigation/MainNavigator.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import ekranów
import HomeScreen from '../screens/Main/HomeScreen';
import ChatListScreen from '../screens/Main/Chat/ChatListScreen';
import ChatConversationScreen from '../screens/Main/Chat/ChatConversationScreen';
import NewChatScreen from '../screens/Main/Chat/NewChatScreen';
import SettingsScreen from '../screens/Main/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Ekran główny' }}
      />
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{ title: 'Lista czatów' }}
      />
      <Stack.Screen
        name="ChatConversation"
        component={ChatConversationScreen}
        options={{ title: 'Rozmowa' }}
      />
      <Stack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{ title: 'Nowy czat' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Ustawienia' }}
      />
            <Stack.Screen
        name="CreateGroupChat"
        component={CreateGroupChatScreen}
        options={{
          title: "Utwórz czat gruptowy",
        }}
      />
      <Stack.Screen
        name="GroupChatList"
        component={GroupChatListScreen}
        options={{
          title: "Lista czatów grupowych",
        }}
      />
      <Stack.Screen
        name="JoinGroupChat"
        component={JoinGroupChatScreen}
        options={{
          title: "Dołącz do czatu grupowego",
        }}
      />
    </Stack.Navigator>
  );
}
