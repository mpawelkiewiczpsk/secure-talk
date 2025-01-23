import sqlite3
from uuid import uuid4
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import Flask, request, jsonify
from flask_cors import CORS
from chat_hub import init_socket
from datetime import datetime


app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
def row_to_dict(cursor, row):
    if row is None:
        return None
    columns = [column[0] for column in cursor.description]
    return dict(zip(columns, row))

def initialize_database():
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                firstName TEXT NOT NULL,
                lastName TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                purpose TEXT,
                token TEXT UNIQUE,
                isActive INTEGER DEFAULT 0
            )
        """)
        
        # Create conversations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # Create conversation_participants table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversation_participants (
                conversation_id INTEGER,
                user_id INTEGER,
                FOREIGN KEY(conversation_id) REFERENCES conversations(id),
                FOREIGN KEY(user_id) REFERENCES users(id),
                PRIMARY KEY (conversation_id, user_id)
            )
        """)

        # Create messages table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER,
                user_id INTEGER,
                content TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                read_by_sender INTEGER DEFAULT 1,
                read_by_receiver INTEGER DEFAULT 0,
                FOREIGN KEY(conversation_id) REFERENCES conversations(id),
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS message_status (
                message_id INTEGER,
                user_id INTEGER,
                is_read INTEGER DEFAULT 0,
                FOREIGN KEY(message_id) REFERENCES messages(id),
                FOREIGN KEY(user_id) REFERENCES users(id),
                PRIMARY KEY (message_id, user_id)
            )
        """)
        
        connection.commit()
        print("Database initialized successfully.")
    except sqlite3.Error as e:
        print(f"Database initialization error: {str(e)}")
    finally:
        connection.close()
        
initialize_database()
init_socket(socketio)
@app.route('/register-request', methods=['POST'])
def register_request():
    first_name = request.json['first_name']
    last_name = request.json['last_name']
    email = request.json['email']
    purpose = request.json['purpose']
    if not first_name or not last_name or not email:
        return jsonify(message="Brak wymaganych pól"
                       ), 400
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO users (firstName, lastName, email, purpose) VALUES (?, ?, ?, ?)",
                       (first_name, last_name, email, purpose if purpose else "",))
        connection.commit()
    except sqlite3.Error:
        return jsonify(message="Błąd serwera"), 500
    connection.close()
    return jsonify(message="Zgłoszenie rejestracji przyjęto")


@app.route('/generate-token/<id>', methods=['PUT'])
def generate_token(id):
    new_token = str(uuid4())
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        cursor.execute("UPDATE users SET token = ?, isActive = 1 WHERE id = ?", (new_token, id))
        if cursor.rowcount == 0:
            return jsonify(message="Nie znaleziono użytkownika o podanym ID"), 404
        connection.commit()
    except sqlite3.Error:
        return jsonify(message="Błąd podczas generowania tokena"), 500
    finally:
        connection.close()
    return jsonify(message="Token wygenerowany", token=new_token)


@app.route('/verify-token', methods=['POST'])
def verify_token():
    token = request.json.get('token')
    if not token:
        return jsonify(valid=False, message="Brak tokena"), 400
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("SELECT * FROM users WHERE token = ? AND isActive = 1", (token,)).fetchone()
        user_dict = row_to_dict(cursor, user)
        if not user_dict:
            return jsonify(valid=False, message="Nieprawidłowy token"), 401
    except sqlite3.Error:
        return jsonify(valid=False, message="Błąd bazy danych"), 500
    finally:
        connection.close()
    return jsonify(valid=True, userData=user_dict)

@app.route('/check-token', methods=['GET'])
def check_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify(message="Brak nagłówka Authorization"), 400
    token = auth_header.split()[1] if len(auth_header.split()) > 1 else None
    if not token:
        return jsonify(message="Brak tokenu w nagłówku"), 400
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("SELECT * FROM users WHERE token = ?", (token,)).fetchone()
        user_dict = row_to_dict(cursor, user)
        if not user_dict:
            return jsonify(message="Token nieważny"), 401
    except sqlite3.Error:
        return jsonify(message="Błąd serwera"), 500
    finally:
        connection.close()
    return jsonify(valid=True, userData=user_dict)


@app.route('/conversations', methods=['GET'])
def get_conversations():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify(message="Brak nagłówka Authorization"), 400
    token = auth_header.split()[1]
    
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        # Get current user id from token
        cursor.execute("SELECT id FROM users WHERE token = ?", (token,))
        user_row = cursor.fetchone()
        if not user_row:
            return jsonify(message="Token nieważny"), 401
        user_id = user_row[0]

        # Fetch only the conversations the user participates in
        cursor.execute("""
            SELECT c.id, c.name, c.created_at
            FROM conversations c
            JOIN conversation_participants cp ON cp.conversation_id = c.id
            WHERE cp.user_id = ?
        """, (user_id,))
        rows = cursor.fetchall()

        conversations = []
        for row in rows:
            conv_id, conv_name, created_at = row
            conversations.append({
                "id": conv_id,
                "name": conv_name,
                "created_at": created_at
            })

        return jsonify(conversations=conversations), 200
    except sqlite3.Error as e:
        return jsonify(message=f"Błąd bazy danych: {str(e)}"), 500
    finally:
        connection.close()
        
@app.route('/users', methods=['GET'])
def get_all_users():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify(message="Brak nagłówka Authorization"), 400
    token = auth_header.split()[1]

    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE token = ?", (token,))
        current_user_row = cursor.fetchone()
        if not current_user_row:
            return jsonify(message="Token nieważny"), 401
        current_user_id = current_user_row[0]
        
        cursor.execute("""
            SELECT id, firstname, lastname
            FROM users
            WHERE id != ?
        """, (current_user_id,))
        rows = cursor.fetchall()

        users = []
        for row in rows:
            user_id, first_name, last_name = row
            full_name = f"{first_name} {last_name}" if first_name and last_name else first_name or last_name
            users.append({
                "id": user_id,
                "name": full_name
            })
        
        return jsonify(users=users), 200
    except sqlite3.Error as e:
        return jsonify(message=f"Błąd bazy danych: {str(e)}"), 500
    finally:
        connection.close()
        
@app.route('/conversations/<conversation_id>/messages', methods=['GET'])
def get_messages(conversation_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify(message="Brak autoryzacji"), 401
    token = auth_header.split()[1]
    
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("SELECT id FROM users WHERE token = ?", (token,)).fetchone()
        if not user:
            return jsonify(message="Nieprawidłowy token"), 401
            
        messages = cursor.execute("""
            SELECT m.id, m.content, m.timestamp, u.firstName, u.lastName, m.user_id
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.timestamp DESC
            LIMIT 50
        """, (conversation_id,)).fetchall()

        last_message = cursor.execute("""
            SELECT id FROM messages 
            WHERE conversation_id = ?
            ORDER BY timestamp DESC 
            LIMIT 1
        """, (conversation_id,)).fetchone()

        if last_message:
            cursor.execute("""
                INSERT INTO message_status (message_id, user_id, is_read)
                SELECT ?, cp.user_id, 0
                FROM conversation_participants cp
                WHERE cp.conversation_id = ? 
                AND cp.user_id = ?
                AND NOT EXISTS (
                    SELECT 1 FROM message_status ms 
                    WHERE ms.message_id = ? 
                    AND ms.user_id = cp.user_id
                )
            """, (last_message[0], conversation_id, user[0], last_message[0]))
        
        return jsonify(messages=[{
            'id': m[0],
            'content': m[1],
            'timestamp': m[2],
            'sender_name': f"{m[3]} {m[4]}",
            'user_id': m[5]
        } for m in messages])
        
    except sqlite3.Error as e:
        return jsonify(message=f"Błąd bazy danych: {str(e)}"), 500
    finally:
        connection.close()
        
 
@app.route('/conversations/<conversation_id>/messages/read', methods=['POST'])
def mark_messages_read(conversation_id):
    auth_header = request.headers.get('Authorization')
    token = auth_header.split()[1]
    
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    
    try:
        
        user = cursor.execute("SELECT id FROM users WHERE token = ?", (token,)).fetchone()
        user_id = user[0]
        
        
        cursor.execute("""
            INSERT OR REPLACE INTO message_status (message_id, user_id, is_read)
            SELECT id, ?, 1
            FROM messages 
            WHERE conversation_id = ? AND user_id != ?
        """, (user_id, conversation_id, user_id))
        
        connection.commit()
        return jsonify({'success': True})
    finally:
        connection.close()
        
@app.route('/conversations/<conversation_id>/messages', methods=['POST'])
def create_message(conversation_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify(message="Brak autoryzacji"), 401
    token = auth_header.split()[1]

    content = request.json.get('content')
    if not content:
        return jsonify(message="Brak treści wiadomości"), 400

    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("SELECT id FROM users WHERE token = ?", (token,)).fetchone()
        if not user:
            return jsonify(message="Nieprawidłowy token"), 401

        cursor.execute("""
            INSERT INTO messages (user_id, conversation_id, content, timestamp)
            VALUES (?, ?, ?, ?)
        """, (
            user[0],
            conversation_id,
            content,
            datetime.now().isoformat()
        ))
        new_message_id = cursor.lastrowid
        
        cursor.execute("""
            INSERT INTO message_status (message_id, user_id, is_read)
            SELECT ?, cp.user_id, 0
            FROM conversation_participants cp
            WHERE cp.conversation_id = ? 
            AND cp.user_id != ?
            AND NOT EXISTS (
                SELECT 1 FROM message_status ms 
                WHERE ms.message_id = ? 
                AND ms.user_id = cp.user_id
            )
        """, (new_message_id, conversation_id, user[0], new_message_id))
        
        connection.commit()

    except sqlite3.Error as e:
        return jsonify(message=f"Błąd bazy danych: {str(e)}"), 500
    finally:
        connection.close()

    return jsonify(message_id=new_message_id, content=content, conversation_id=conversation_id)

@app.route('/unread-messages', methods=['GET'])
def get_unread_messages():
    auth_header = request.headers.get('Authorization')
    token = auth_header.split()[1]
    
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    
    try:
        user = cursor.execute("SELECT id FROM users WHERE token = ?", (token,)).fetchone()
        user_id = user[0]
        
        cursor.execute("""
            SELECT m.user_id, COUNT(*) as unread_count
            FROM messages m
            JOIN message_status ms ON m.id = ms.message_id
            WHERE ms.user_id = ? AND ms.is_read = 0
            GROUP BY m.user_id
        """, (user_id,))
        
        unread_counts = {row[0]: row[1] for row in cursor.fetchall()}
        return jsonify({'unreadCounts': unread_counts})
    finally:
        connection.close()
        
@app.route('/conversations', methods=['POST'])
def create_conversation():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify(message="Brak nagłówka Authorization"), 400
    token = auth_header.split()[1]

    recipient_id = request.json.get('recipient_id')
    if not recipient_id:
        return jsonify(message="Brak odbiorcy"), 400
    
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        
        cursor.execute("SELECT id FROM users WHERE token = ?", (token,))
        sender_row = cursor.fetchone()
        if not sender_row:
            return jsonify(message="Nieprawidłowy token"), 401
        sender_id = sender_row[0]

        
        cursor.execute("SELECT id FROM users WHERE id = ?", (recipient_id,))
        recipient_row = cursor.fetchone()
        if not recipient_row:
            return jsonify(message="Nie znaleziono takiego usera"), 404

        if sender_id == recipient_id:
            return jsonify(message="Nie możesz rozpocząć czatu z samym sobą"), 400

       
        cursor.execute("""
            SELECT c.id
            FROM conversation_participants cp1
            JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
            JOIN conversations c ON c.id = cp1.conversation_id
            WHERE cp1.user_id = ? AND cp2.user_id = ?
        """, (sender_id, recipient_id))
        existing_conv = cursor.fetchone()
        if existing_conv:
            return jsonify(conversation_id=existing_conv[0], message="Konwersacja już istnieje"), 200

        
        now = datetime.utcnow().isoformat()
        cursor.execute("INSERT INTO conversations (name, created_at) VALUES (?, ?)", ("", now))
        conversation_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (?, ?), (?, ?)
        """, (conversation_id, sender_id, conversation_id, recipient_id))

        connection.commit()
        return jsonify(conversation_id=conversation_id, message="Nowa konwersacja utworzona"), 201
    except sqlite3.Error as e:
        return jsonify(message=f"Błąd bazy danych: {e}"), 500
    finally:
        connection.close()

@app.route('/lista', methods=['GET'])
def get_list():
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    user = cursor.execute("SELECT * FROM users").fetchall()
    return user
        
if __name__ == '__main__':
    socketio.run(app, debug=True, port=3000, host='0.0.0.0')