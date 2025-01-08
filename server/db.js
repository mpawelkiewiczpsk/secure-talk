const sqlite3 = require('sqlite3').verbose();

// Utworzy (lub otworzy) bazę w pliku "mydatabase.sqlite"
const db = new sqlite3.Database('mydatabase.sqlite', (err) => {
  if (err) {
    console.error('Nie można otworzyć bazy danych:', err.message);
  } else {
    console.log('Połączono z bazą SQLite');
  }
});

// Utworzenie tabeli "users" (jeśli nie istnieje)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      email TEXT,
      purpose TEXT,
      token TEXT,
      isActive INTEGER DEFAULT 0
    )
  `);
});

module.exports = db;
