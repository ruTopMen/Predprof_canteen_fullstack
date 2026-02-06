import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../database';
import { SECRET_KEY } from '../auth.middleware';

const router = express.Router();

// Регистрация
router.post('/register', async (req, res) => {
  const { username, password, role, allergies } = req.body;
  const db = getDB();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.run(
      `INSERT INTO users (username, password, role, allergies) VALUES (?, ?, ?, ?)`,
      [username, hashedPassword, role, allergies || '']
    );
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Username already exists' });
  }
});

// Вход
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = getDB();

  const user = await db.get(`SELECT * FROM users WHERE username = ?`, [username]);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
  res.json({ token, role: user.role, allergies: user.allergies });
});

export default router;