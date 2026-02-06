import express from 'express';
import { getDB } from '../database';
import { verifyToken, checkRole } from '../auth.middleware';

const router = express.Router();

// Статистика (сколько денег заработано, сколько потрачено, чистая прибыль)
router.get('/stats', verifyToken, checkRole(['admin']), async (req, res) => {
  const db = getDB();

  const totalSales = await db.get(`
    SELECT COUNT(*) as total_orders, SUM(m.price) as total_revenue 
    FROM orders o 
    JOIN menu m ON o.menu_item_id = m.id
  `);

  const totalExpenses = await db.get(`
    SELECT SUM(total_cost) as total_expenses 
    FROM procurement_requests 
    WHERE status = 'approved'
  `);

  const revenue = totalSales.total_revenue || 0;
  const expenses = totalExpenses.total_expenses || 0;

  res.json({
    total_orders: totalSales.total_orders,
    total_revenue: revenue,
    total_expenses: expenses,
    net_profit: revenue - expenses
  });
});

// Просмотр заявок на закупку
router.get('/requests', verifyToken, checkRole(['admin']), async (req, res) => {
  const db = getDB();
  const requests = await db.all('SELECT * FROM procurement_requests WHERE status = "pending"');
  res.json(requests);
});

// Одобрение заявки (с указанием стоимости закупки)
router.put('/requests/:id/approve', verifyToken, checkRole(['admin']), async (req, res) => {
  const db = getDB();
  const { total_cost } = req.body;

  if (total_cost === undefined || total_cost < 0) {
    // Если стоимость не передана, можно разрешить (0) или требовать.
    // ТЗ не уточняет, но для учета расходов лучше требовать, если > 0.
    // Пока сделаем warning или default 0.
  }

  await db.run('UPDATE procurement_requests SET status = "approved", total_cost = ? WHERE id = ?',
    [total_cost || 0, req.params.id]);

  res.json({ message: 'Request approved', total_cost: total_cost || 0 });
});

// --- НОВАЯ ФУНКЦИЯ: ОТЧЕТ О БЛЮДАХ ---

// Детальный отчет: какое блюдо сколько раз купили и сколько оно принесло денег
router.get('/dishes-report', verifyToken, checkRole(['admin']), async (req, res) => {
  const db = getDB();
  const report = await db.all(`
    SELECT 
      m.name AS dish_name, 
      COUNT(o.id) AS quantity_sold, 
      SUM(m.price) AS total_revenue
    FROM orders o
    JOIN menu m ON o.menu_item_id = m.id
    GROUP BY m.id
    ORDER BY quantity_sold DESC
  `);
  res.json(report);
});

// Детальный отчет по расходам (одобренные закупки)
router.get('/expenses-report', verifyToken, checkRole(['admin']), async (req, res) => {
  const db = getDB();
  const report = await db.all(`
    SELECT * FROM procurement_requests 
    WHERE status = 'approved' 
    ORDER BY id DESC
  `);
  res.json(report);
});

// Аналитика по дням (Доходы и Посещаемость)
router.get('/analytics', verifyToken, checkRole(['admin']), async (req, res) => {
  const db = getDB();
  const { startDate, endDate } = req.query;

  // Базовый SQL
  let query = `
    SELECT 
      strftime('%Y-%m-%d', o.date) as day,
      SUM(m.price) as income,
      COUNT(CASE WHEN o.status = 'received' THEN 1 END) as visits
    FROM orders o
    JOIN menu m ON o.menu_item_id = m.id
  `;

  const params: any[] = [];
  const validDateRegex = /^\d{4}-\d{2}-\d{2}$/;

  // -- ПЕРЕПИСЫВАЕМ ЛОГИКУ ФОРМИРОВАНИЯ ЗАПРОСА --
  let conditions: string[] = [];

  if (typeof startDate === 'string' && validDateRegex.test(startDate)) {
    conditions.push(`strftime('%Y-%m-%d', o.date) >= ?`);
    params.push(startDate);
  } else if (!endDate) {
    // Default: Last 30 days ONLY if neither start nor end is provided (or invalid)
    conditions.push(`strftime('%Y-%m-%d', o.date) >= date('now', '-30 days')`);
  }

  if (typeof endDate === 'string' && validDateRegex.test(endDate)) {
    conditions.push(`strftime('%Y-%m-%d', o.date) <= ?`);
    params.push(endDate);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += `
    GROUP BY strftime('%Y-%m-%d', o.date)
    ORDER BY day ASC
  `;

  const analytics = await db.all(query, params);

  console.log('Analytics data:', analytics);

  // Маппинг для фронтенда (там ожидается date)
  const result = analytics.map(row => ({
    date: row.day,
    income: row.income,
    visits: row.visits
  }));

  res.json(result);
});

export default router;