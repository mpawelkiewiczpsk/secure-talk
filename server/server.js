const express = require('express');
const cors = require('cors');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Rejestracja zgłoszenia
app.post('/register-request', (req, res) => {
  const { firstName, lastName, email, purpose } = req.body;
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: 'Brak wymaganych pól' });
  }

  const sql = `
    INSERT INTO users (firstName, lastName, email, purpose)
    VALUES (?, ?, ?, ?)
  `;
  db.run(sql, [firstName, lastName, email, purpose || ''], function (err) {
    if (err) {
      console.error('Błąd przy zapisie do bazy:', err.message);
      return res.status(500).json({ message: 'Błąd serwera' });
    }
    return res.json({ message: 'Zgłoszenie rejestracji przyjęte' });
  });
});

// 2. Generowanie tokenu (udajemy panel administratora)
app.put('/generate-token/:id', (req, res) => {
  // Admin wchodzi na /generate-token/ID_uzytkownika
  // i generujemy token = uuid
  const userId = req.params.id;
  const newToken = uuidv4(); // unikalny token

  const sql = `
    UPDATE users
    SET token = ?, isActive = 1
    WHERE id = ?
  `;
  db.run(sql, [newToken, userId], function (err) {
    if (err) {
      console.error('Błąd przy aktualizacji tokenu:', err.message);
      return res.status(500).json({ message: 'Błąd serwera' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
    }
    return res.json({ message: 'Token wygenerowany', token: newToken });
  });
});

// 3. Weryfikacja tokenu
app.post('/verify-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Brak tokenu' });
  }

  const sql = `
    SELECT * FROM users
    WHERE token = ? AND isActive = 1
  `;
  db.get(sql, [token], (err, row) => {
    if (err) {
      console.error('Błąd przy weryfikacji tokenu:', err.message);
      return res.status(500).json({ message: 'Błąd serwera' });
    }
    if (!row) {
      return res.status(401).json({ message: 'Nieprawidłowy token' });
    }
    // Token poprawny
    return res.json({ valid: true, userData: row });
  });
});

// 4. Sprawdzenie ważności tokenu (np. przy starcie aplikacji)
app.get('/check-token', (req, res) => {
  // Token wysyłamy w nagłówku:
  // Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(400).json({ message: 'Brak nagłówka Authorization' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer <token>"
  if (!token) {
    return res.status(400).json({ message: 'Brak tokenu w nagłówku' });
  }

  const sql = `
    SELECT * FROM users
    WHERE token = ? AND isActive = 1
  `;
  db.get(sql, [token], (err, row) => {
    if (err) {
      console.error('Błąd przy check-token:', err.message);
      return res.status(500).json({ message: 'Błąd serwera' });
    }
    if (!row) {
      return res.status(401).json({ message: 'Token nieważny' });
    }
    // Token poprawny
    return res.json({ valid: true, userData: row });
  });
});

// Uruchamiamy serwer
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
