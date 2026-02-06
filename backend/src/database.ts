import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database;

export const initDB = async () => {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  // Создаем таблицы
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT CHECK(role IN ('student', 'cook', 'admin')),
      allergies TEXT,
      balance REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS menu (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      price REAL,
      type TEXT,
      available_qty INTEGER
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      menu_item_id INTEGER,
      type TEXT,
      status TEXT DEFAULT 'paid',
      date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(menu_item_id) REFERENCES menu(id)
    );

    CREATE TABLE IF NOT EXISTS procurement_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cook_id INTEGER,
      item_name TEXT,
      quantity INTEGER,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY(cook_id) REFERENCES users(id)
    );

    -- НОВАЯ ТАБЛИЦА ОТЗЫВОВ
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      menu_item_id INTEGER,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      date TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(menu_item_id) REFERENCES menu(id)
    );

    -- ТАБЛИЦА СКЛАДА ПРОДУКТОВ
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL UNIQUE,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      min_threshold REAL DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now'))
    );
  `);

  console.log('Connected to SQLite database');
  return db;
};

export const getDB = () => {
  if (!db) throw new Error('Database not initialized');
  return db;
};