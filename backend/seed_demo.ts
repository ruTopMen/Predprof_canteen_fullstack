import { getDB, initDB } from './src/database';
import bcrypt from 'bcryptjs';

async function seed() {
    await initDB();
    const db = getDB();

    console.log("🧹 Очистка таблиц...");
    await db.run('DELETE FROM reviews');
    await db.run('DELETE FROM orders');
    await db.run('DELETE FROM procurement_requests');
    await db.run('DELETE FROM inventory');
    await db.run('DELETE FROM menu');
    await db.run('DELETE FROM users');

    console.log("👤 Создание пользователей...");
    const hashedPass = await bcrypt.hash('123', 10);

    // Ученики
    await db.run(
        `INSERT INTO users (username, password, role, balance, allergies) VALUES (?, ?, ?, ?, ?)`,
        ['ученик1', hashedPass, 'student', 1500, 'орехи']
    );
    await db.run(
        `INSERT INTO users (username, password, role, balance, allergies) VALUES (?, ?, ?, ?, ?)`,
        ['demo_student', hashedPass, 'student', 2000, '']
    );

    // Повар
    await db.run(
        `INSERT INTO users (username, password, role, balance, allergies) VALUES (?, ?, ?, ?, ?)`,
        ['повар', hashedPass, 'cook', 0, '']
    );

    // Администратор
    await db.run(
        `INSERT INTO users (username, password, role, balance, allergies) VALUES (?, ?, ?, ?, ?)`,
        ['админ', hashedPass, 'admin', 0, '']
    );

    console.log("🍽️ Добавление меню...");

    // Завтраки
    const breakfasts = [
        { name: 'Каша овсяная с ягодами', description: 'Овсяная каша на молоке с клубникой и черникой', price: 85, type: 'breakfast', qty: 30 },
        { name: 'Омлет с сыром', description: 'Пышный омлет из 2 яиц с плавленым сыром', price: 95, type: 'breakfast', qty: 25 },
        { name: 'Творожная запеканка', description: 'Домашняя запеканка с изюмом и сметаной', price: 80, type: 'breakfast', qty: 20 },
        { name: 'Блинчики с мёдом', description: 'Тонкие блинчики (3 шт.) с натуральным мёдом', price: 90, type: 'breakfast', qty: 25 },
    ];

    // Обеды
    const lunches = [
        { name: 'Борщ с мясом', description: 'Традиционный борщ со свининой и сметаной', price: 120, type: 'lunch', qty: 40 },
        { name: 'Котлета с пюре', description: 'Куриная котлета с картофельным пюре и подливой', price: 150, type: 'lunch', qty: 35 },
        { name: 'Рыба с рисом', description: 'Филе минтая запечённое с рисом и овощами', price: 140, type: 'lunch', qty: 25 },
        { name: 'Макароны с сыром', description: 'Макароны с сырным соусом и зеленью', price: 100, type: 'lunch', qty: 30 },
        { name: 'Куриный суп с лапшой', description: 'Лёгкий суп с курицей и домашней лапшой', price: 110, type: 'lunch', qty: 35 },
    ];

    for (const item of [...breakfasts, ...lunches]) {
        await db.run(
            `INSERT INTO menu (name, description, price, type, available_qty) VALUES (?, ?, ?, ?, ?)`,
            [item.name, item.description, item.price, item.type, item.qty]
        );
    }

    console.log("📦 Добавление склада...");
    const inventory = [
        { name: 'Картофель', quantity: 50, unit: 'кг' },
        { name: 'Морковь', quantity: 30, unit: 'кг' },
        { name: 'Лук репчатый', quantity: 25, unit: 'кг' },
        { name: 'Курица', quantity: 40, unit: 'кг' },
        { name: 'Молоко', quantity: 60, unit: 'л' },
        { name: 'Яйца', quantity: 200, unit: 'шт' },
        { name: 'Мука', quantity: 30, unit: 'кг' },
    ];

    for (const item of inventory) {
        await db.run(
            `INSERT INTO inventory (product_name, quantity, unit) VALUES (?, ?, ?)`,
            [item.name, item.quantity, item.unit]
        );
    }

    console.log("✅ База данных готова к съёмке!");
    console.log("");
    console.log("📋 Тестовые аккаунты:");
    console.log("   Ученик:  demo_student / 123  (баланс: 2000₽)");
    console.log("   Повар:   повар / 123");
    console.log("   Админ:   админ / 123");

    process.exit(0);
}

seed().catch(console.error);
