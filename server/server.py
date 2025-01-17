import sqlite3
from uuid import uuid4
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import Flask, request, jsonify
from flask_cors import CORS
from chat_hub import init_socket
from datetime import datetime
# app = Flask(__name__)
# socketio = SocketIO(app, cors_allowed_origins="*")
# init_socket(socketio)
# CORS(app)

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

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
        user = cursor.execute("SELECT * FROM users WHERE token = ? AND isActive = 1",
                              (token,)).fetchone()
        if not user:
            return jsonify(valid=False, message="Nieprawidłowy token"), 401
    except sqlite3.Error:
        return jsonify(valid=False, message="Błąd bazy danych"), 500
    finally:
        connection.close()
    return jsonify(valid=True, userData=user)

@app.route('/check-token')
def check_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify(message="Brak nagłówka Authorization"), 400
    token = auth_header.split()[1]
    if not token:
        return jsonify(message="Brak tokenu w nagłówku"), 400
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("SELECT * FROM users WHERE token = ?", (token,)).fetchone()
        if not user:
            return jsonify(message="Token nieważny"), 401
    except sqlite3.Error:
        return jsonify(message="Błąd serwera"), 500
    connection.close()
    return jsonify(valid=True, userData=user)
@app.route('/conversations', methods=['GET'])
def get_conversations():
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
            
        conversations = cursor.execute("""
            SELECT DISTINCT c.id, c.name, c.created_at, 
                   (SELECT COUNT(*) FROM messages m 
                    WHERE m.conversation_id = c.id) as message_count
            FROM conversations c
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = ?
            ORDER BY c.created_at DESC
        """, (user[0],)).fetchall()
        
        return jsonify(conversations=[{
            'id': c[0],
            'name': c[1],
            'created_at': c[2],
            'message_count': c[3]
        } for c in conversations])
        
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

@app.route('/conversations', methods=['POST'])
def create_conversation():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify(message="Brak nagłówka autoryzacji"), 401
    token = auth_header.split()[1]

    recipient_token = request.json.get('recipient_token')
    if not recipient_token:
        return jsonify(message="Brak tokena odbiorcy"), 400

    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("SELECT id FROM users WHERE token = ?", (token,)).fetchone()
        if not user:
            return jsonify(message="Nieprawidłowy token"), 401

        recipient = cursor.execute("SELECT id FROM users WHERE token = ?", (recipient_token,)).fetchone()
        if not recipient:
            return jsonify(message="Nie znaleziono użytkownika o podanym tokenie"), 404
        
        recipient_id = recipient[0]

        cursor.execute("INSERT INTO conversations (created_at) VALUES (?)",
                       (datetime.now().isoformat(),))
        conversation_id = cursor.lastrowid

        cursor.execute("INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)",
                       (conversation_id, user[0]))
        cursor.execute("INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)",
                       (conversation_id, recipient_id))

        connection.commit()
        return jsonify(conversation_id=conversation_id, message="Utworzono konwersację")
    except sqlite3.Error as e:
        return jsonify(message=f"Błąd bazy danych: {str(e)}"), 500
    finally:
        connection.close()
        
if __name__ == '__main__':
    # app.run(debug=True, port=3000, host='0.0.0.0')
    # socketio.run(app, debug=True, port=3001, host='0.0.0.0',allow_unsafe_werkzeug=True)
    socketio.run(app, debug=True, port=3000, host='0.0.0.0')