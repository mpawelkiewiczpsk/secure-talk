import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MessageBubble({ message, currentUserId }) {
    console.log('Rendering message:', message); // Add this line
    console.log('Current User ID:', currentUserId); // Add this line
    const isOwnMessage = message.user_id === currentUserId;

    return (
        <View style={[
            styles.bubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
            <Text style={[styles.text, { color: isOwnMessage ? '#fff' : '#000' }]}>
                {message.content}
            </Text>
            <Text style={styles.timestamp}>
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
        maxWidth: '80%',
    },
    ownBubble: {
        backgroundColor: '#25D366', 
        alignSelf: 'flex-end',
    },
    otherBubble: {
        backgroundColor: '#0084FF', 
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 16,
    },
    timestamp: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        marginTop: 5,
        textAlign: 'right',
    },
});