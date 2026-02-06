import express from 'express';
import { getDB } from '../database';
import { verifyToken, checkRole, AuthRequest } from '../auth.middleware';

const router = express.Router();

// Добавить блюдо в меню (или обновить остатки)
router.post('/menu', verifyToken, checkRole(['cook', 'admin']), async (req, res) => {
  const { name, description, price, type, available_qty } = req.body;
  const db = getDB();

  const existing = await db.get('SELECT * FROM menu WHERE name = ?', [name]);

  if (existing) {
    await db.run(
      `UPDATE menu SET available_qty = available_qty + ?, price = ?, description = ? WHERE id = ?`,
      [available_qty, price, description, existing.id]
    );
    res.json({ message: 'Menu item updated' });
  } else {
    await db.run(
      `INSERT INTO menu (name, description, price, type, available_qty) VALUES (?, ?, ?, ?, ?)`,
      [name, description, price, type, available_qty]
    );
    res.json({ message: 'Menu item added' });
  }
});

// Создать заявку на закупку продуктов
router.post('/request', verifyToken, checkRole(['cook']), async (req: AuthRequest, res) => {
  const { item_name, quantity } = req.body;
  const db = getDB();

  await db.run(
    `INSERT INTO procurement_requests (cook_id, item_name, quantity) VALUES (?, ?, ?)`,
    [req.user?.id, item_name, quantity]
  );
  res.json({ message: 'Request sent to admin' });
});

// Посмотреть список выданных блюд (для отчетности)
router.get('/served', verifyToken, checkRole(['cook']), async (req, res) => {
  const db = getDB();
  const served = await db.all(`
    SELECT o.id, m.name, u.username, o.date 
    FROM orders o 
    JOIN menu m ON o.menu_item_id = m.id 
    JOIN users u ON o.user_id = u.id 
    WHERE o.status = 'received'
  `);
  res.json(served);
});

export default router;