from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
import sqlite3
from datetime import datetime

socketio = SocketIO(cors_allowed_origins="*")
connected_users = {}

def init_socket(app):
    print("Socket.IO initializing...")

@socketio.on('connect')
def handle_connect():
        try:
            token = request.args.get('token')
            if not token or token == 'null':
                return False
            if not verify_token(token):
                return False
            user_data = get_user_data(token)
            if not user_data:
                return False
            user_id = user_data[0]
            connected_users[request.sid] = {
                'user_id': user_id,
                'name': f"{user_data[1]} {user_data[2]}"
            }
            print(f"[Socket connected] {connected_users[request.sid]['name']} SID:{request.sid}")
            return True
        except Exception as e:
            print(f"[Socket error] {str(e)}")
            return False

@socketio.on('disconnect')
def handle_disconnect():
        if request.sid in connected_users:
            user = connected_users[request.sid]
            print(f"User {user['name']} disconnected")
            del connected_users[request.sid]

@socketio.on('join_conversation')
def handle_join(data):
        try:
            if request.sid not in connected_users:
                return
            
            conversation_id = data.get('conversationId')
            if not conversation_id:
                return
                
            join_room(conversation_id)
            print(f"User {connected_users[request.sid]['name']} joined room {conversation_id}")
            
        except Exception as e:
            print(f"Join room error: {str(e)}")

@socketio.on('leave_conversation')
def handle_leave(data):
        try:
            if request.sid not in connected_users:
                return
                
            conversation_id = data.get('conversationId')
            if not conversation_id:
                return
                
            leave_room(conversation_id)
            print(f"User {connected_users[request.sid]['name']} left room {conversation_id}")
            
        except Exception as e:
            print(f"Leave room error: {str(e)}")

@socketio.on('send_message')
def handle_message(data):
    try:
        user_id = connected_users[request.sid]['user_id']
        conversation_id = data['conversationId']
        content = data['content']
        timestamp = datetime.now().isoformat()

        connection = sqlite3.connect('mydatabase.sqlite')
        cursor = connection.cursor()

        # Insert message
        cursor.execute("""
            INSERT INTO messages (conversation_id, user_id, content, timestamp)
            VALUES (?, ?, ?, ?)
        """, (conversation_id, user_id, content, timestamp))
        message_id = cursor.lastrowid

        # Get other participants
        cursor.execute("""
            SELECT user_id FROM conversation_participants 
            WHERE conversation_id = ? AND user_id != ?
        """, (conversation_id, user_id))
        
        participants = cursor.fetchall()
        
        # Insert unread status for all participants
        for participant in participants:
            cursor.execute("""
                INSERT INTO message_status (message_id, user_id, is_read)
                VALUES (?, ?, 0)
            """, (message_id, participant[0]))

        connection.commit()
        connection.close()

        # Emit to room
        emit(f"conversation_{conversation_id}", {  # Upewniamy się, że nazwa eventu pasuje
            'user_id': user_id,
            'conversation_id': conversation_id,
            'content': content,
            'timestamp': timestamp
        }, room=f"conversation_{conversation_id}")
        
    except Exception as e:
        print(f"Error handling message: {str(e)}")

@socketio.on_error_default
def default_error_handler(e):
        print(f"SocketIO error: {str(e)}")
        return False

def verify_token(token):
    if not token or token == 'null':
        return False
        
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("""
            SELECT * FROM users 
            WHERE token = ? AND isActive = 1
        """, (token,)).fetchone()
        return bool(user)
    except sqlite3.Error as e:
        print(f"Database error in verify_token: {str(e)}")
        return False
    finally:
        connection.close()

def get_user_data(token):
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("""
            SELECT id, firstName, lastName 
            FROM users 
            WHERE token = ? AND isActive = 1
        """, (token,)).fetchone()
        return user
    except sqlite3.Error as e:
        print(f"Database error in get_user_data: {str(e)}")
        return None
    finally:
        connection.close()

def save_message(message):
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        cursor.execute("""
            INSERT INTO messages (user_id, conversation_id, content, timestamp)
            VALUES (?, ?, ?, ?)
        """, (
            message['user_id'],
            message['conversation_id'],
            message['content'],
            message['timestamp']
        ))
        connection.commit()
    except sqlite3.Error as e:
        print(f"Database error in save_message: {str(e)}")
    finally:
        connection.close()
# Nowe zdarzenia dla grupowych czatów
@socketio.on('join_group')
def handle_join_group(data):
    try:
        if request.sid not in connected_users:
            return
        
        group_id = data.get('groupId')
        if not group_id:
            return
            
        join_room(f"group_{group_id}")
        print(f"User {connected_users[request.sid]['name']} joined group {group_id}")
        
    except Exception as e:
        print(f"Join group error: {str(e)}")

@socketio.on('leave_group')
def handle_leave_group(data):
    try:
        if request.sid not in connected_users:
            return
            
        group_id = data.get('groupId')
        if not group_id:
            return
            
        leave_room(f"group_{group_id}")
        print(f"User {connected_users[request.sid]['name']} left group {group_id}")
        
    except Exception as e:
        print(f"Leave group error: {str(e)}")

@socketio.on('send_group_message')
def handle_group_message(data):
    try:
        user_id = connected_users[request.sid]['user_id']
        group_id = data['groupId']
        content = data['content']
        timestamp = datetime.now().isoformat()

        connection = sqlite3.connect('mydatabase.sqlite')
        cursor = connection.cursor()

        # Insert group message
        cursor.execute("""
            INSERT INTO group_messages (group_conversation_id, user_id, content, timestamp)
            VALUES (?, ?, ?, ?)
        """, (group_id, user_id, content, timestamp))
        message_id = cursor.lastrowid

        connection.commit()
        connection.close()

        # Emit to group room
        emit('group_message', {
            'user_id': user_id,
            'group_id': group_id,
            'content': content,
            'timestamp': timestamp
        }, room=f"group_{group_id}")
        
    except Exception as e:
        print(f"Error handling group message: {str(e)}")

@socketio.on_error_default
def default_error_handler(e):
    print(f"SocketIO error: {str(e)}")
    return False

def verify_token(token):
    if not token or token == 'null':
        return False
        
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("""
            SELECT * FROM users 
            WHERE token = ? AND isActive = 1
        """, (token,)).fetchone()
        return bool(user)
    except sqlite3.Error as e:
        print(f"Database error in verify_token: {str(e)}")
        return False
    finally:
        connection.close()

def get_user_data(token):
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("""
            SELECT id, firstName, lastName 
            FROM users 
            WHERE token = ? AND isActive = 1
        """, (token,)).fetchone()
        return user
    except sqlite3.Error as e:
        print(f"Database error in get_user_data: {str(e)}")
        return None
    finally:
        connection.close()

def save_message(message):
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        cursor.execute("""
            INSERT INTO messages (user_id, conversation_id, content, timestamp)
            VALUES (?, ?, ?, ?)
        """, (
            message['user_id'],
            message['conversation_id'],
            message['content'],
            message['timestamp']
        ))
        connection.commit()
    except sqlite3.Error as e:
        print(f"Database error in save_message: {str(e)}")
    finally:
        connection.close()