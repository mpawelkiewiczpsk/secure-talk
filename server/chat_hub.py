from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request
import sqlite3
from datetime import datetime

socketio = SocketIO()
connected_users = {}

def init_socket(app):
    print("Socket.IO initializing...")
   # socketio.init_app(app, cors_allowed_origins="*")

    @socketio.on('connect')
    def handle_connect():
        try:
            print(f"Client connecting... SID: {request.sid}")
            token = request.args.get('token')
            
            if not token or token == 'null':
                print(f"Connection rejected - invalid token: {token}")
                return False
                
            if not verify_token(token):
                print(f"Connection rejected - token verification failed")
                return False
                
            user_data = get_user_data(token)
            if not user_data:
                print(f"Connection rejected - user not found")
                return False
                
            user_id = user_data[0]
            connected_users[request.sid] = {
                'user_id': user_id,
                'name': f"{user_data[1]} {user_data[2]}"
            }
            print(f"User {connected_users[request.sid]['name']} connected")
            return True
            
        except Exception as e:
            print(f"Connection error: {str(e)}")
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
            if request.sid not in connected_users:
                return
                
            user = connected_users[request.sid]
            conversation_id = data.get('conversationId')
            content = data.get('content')
            
            if not conversation_id or not content:
                return
                
            message = {
                'user_id': user['user_id'],
                'sender_name': user['name'],
                'content': content,
                'timestamp': datetime.now().isoformat(),
                'conversation_id': conversation_id
            }
            
            save_message(message)
            emit('message', message, room=conversation_id)
            print(f"Message sent in conversation {conversation_id}")
            
        except Exception as e:
            print(f"Message handling error: {str(e)}")

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
