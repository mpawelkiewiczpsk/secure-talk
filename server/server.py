import sqlite3
from uuid import uuid4

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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
def generate_token():
    user_id = request.args.get('id')
    new_token = uuid4()
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("UPDATE users SET token = ?, isActive = 1 WHERE id = ?",
                       (new_token, user_id,)).fetchone()
        if not user:
            return jsonify(message="Nie znaleziono użytkownika"), 404
        connection.commit()
    except sqlite3.Error:
        return jsonify(message="Błąd serwera"), 500
    connection.close()
    return jsonify(message="Token wygenerowany", token=new_token)

@app.route('/verify-token', methods=['POST'])
def verify_token():
    token = request.json['token']
    if not token:
        return jsonify(message="Brak tokenu"), 400
    connection = sqlite3.connect('mydatabase.sqlite')
    cursor = connection.cursor()
    try:
        user = cursor.execute("SELECT * FROM users WHERE token = ? AND isActive = 1",
                              (token,)).fetchone()
        if not user:
            return jsonify(message="Nieprawidłowy token"), 401
    except sqlite3.Error:
        return jsonify(message="Błąd serwera"), 500
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

if __name__ == '__main__':
    app.run(debug=True, port=3000, host='0.0.0.0')