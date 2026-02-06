import express from 'express';
import { getDB } from '../database';
import { verifyToken, checkRole, AuthRequest } from '../auth.middleware';

const router = express.Router();

// Получить все продукты на складе
router.get('/inventory', verifyToken, checkRole(['cook', 'admin']), async (req, res) => {
    try {
        const db = getDB();
        const inventory = await db.all('SELECT * FROM inventory ORDER BY product_name');
        res.json(inventory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка получения данных склада' });
    }
});

// Добавить новый продукт на склад
router.post('/inventory', verifyToken, checkRole(['cook', 'admin']), async (req, res) => {
    const { product_name, quantity, unit, min_threshold } = req.body;
    const db = getDB();

    if (!product_name || !quantity || !unit) {
        return res.status(400).json({ message: 'Не все обязательные поля заполнены' });
    }

    if (quantity < 0) {
        return res.status(400).json({ message: 'Количество не может быть отрицательным' });
    }

    try {
        // Проверяем, есть ли уже такой продукт
        const existing = await db.get('SELECT * FROM inventory WHERE product_name = ?', [product_name]);

        if (existing) {
            // Если продукт существует, обновляем количество
            await db.run(
                `UPDATE inventory SET quantity = quantity + ?, last_updated = datetime('now') WHERE id = ?`,
                [quantity, existing.id]
            );
            return res.json({ message: 'Количество продукта обновлено' });
        }

        await db.run(
            `INSERT INTO inventory (product_name, quantity, unit, min_threshold, last_updated) 
       VALUES (?, ?, ?, ?, datetime('now'))`,
            [product_name, quantity, unit, min_threshold || 0]
        );

        res.json({ message: 'Продукт добавлен на склад' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка добавления продукта' });
    }
});

// Обновить количество продукта
router.patch('/inventory/:id', verifyToken, checkRole(['cook', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { quantity, min_threshold } = req.body;
    const db = getDB();

    if (quantity !== undefined && quantity < 0) {
        return res.status(400).json({ message: 'Количество не может быть отрицательным' });
    }

    try {
        const product = await db.get('SELECT * FROM inventory WHERE id = ?', [id]);

        if (!product) {
            return res.status(404).json({ message: 'Продукт не найден' });
        }

        // Обновляем только те поля, которые переданы
        const updates: string[] = [];
        const values: any[] = [];

        if (quantity !== undefined) {
            updates.push('quantity = ?');
            values.push(quantity);
        }

        if (min_threshold !== undefined) {
            updates.push('min_threshold = ?');
            values.push(min_threshold);
        }

        updates.push("last_updated = datetime('now')");
        values.push(id);

        await db.run(
            `UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Данные продукта обновлены' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка обновления продукта' });
    }
});

// Удалить продукт со склада
router.delete('/inventory/:id', verifyToken, checkRole(['cook', 'admin']), async (req, res) => {
    const { id } = req.params;
    const db = getDB();

    try {
        const product = await db.get('SELECT * FROM inventory WHERE id = ?', [id]);

        if (!product) {
            return res.status(404).json({ message: 'Продукт не найден' });
        }

        await db.run('DELETE FROM inventory WHERE id = ?', [id]);
        res.json({ message: 'Продукт удалён со склада' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка удаления продукта' });
    }
});

export default router;
