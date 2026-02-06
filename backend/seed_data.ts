import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const seed = async () => {
    console.log('🌱 Starting seeder...');

    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    // 1. Ensure Menu Items
    const menu = await db.all('SELECT * FROM menu');
    if (menu.length === 0) {
        console.log('Adding default menu items...');
        await db.exec(`
      INSERT INTO menu (name, description, price, type, available_qty) VALUES 
      ('Caesar Salad', 'Fresh salad', 150, 'lunch', 100),
      ('Borscht', 'Traditional soup', 120, 'lunch', 100),
      ('Pancakes', 'With honey', 80, 'breakfast', 100),
      ('Compote', 'Berry drink', 40, 'drink', 200);
    `);
    }

    // 2. Ensure Users
    const users = await db.all('SELECT * FROM users WHERE role="student"');
    if (users.length === 0) {
        console.log('Adding default student...');
        await db.run(`INSERT INTO users (username, password, role, balance) VALUES ('student_seed', '123', 'student', 10000)`);
    }
    const student = await db.get('SELECT id FROM users WHERE role="student" LIMIT 1');
    const user_id = student.id;

    // 3. Generate Orders for last 14 days
    console.log('Generating orders...');

    const menuItems = await db.all('SELECT id, price FROM menu');
    const statuses = ['paid', 'received'];

    for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

        // Random number of orders per day (2 to 10)
        const ordersCount = Math.floor(Math.random() * 8) + 2;

        for (let j = 0; j < ordersCount; j++) {
            const item = menuItems[Math.floor(Math.random() * menuItems.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            // Random time within that day
            const hour = 9 + Math.floor(Math.random() * 8); // 9:00 - 17:00
            const minute = Math.floor(Math.random() * 60);
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
            const fullDate = `${dateStr} ${timeStr}`;

            await db.run(
                `INSERT INTO orders (user_id, menu_item_id, type, status, date) VALUES (?, ?, 'single', ?, ?)`,
                [user_id, item.id, status, fullDate]
            );
        }
    }

    console.log('✅ Seeding complete!');
};

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
