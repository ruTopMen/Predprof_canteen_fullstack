
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        await db.exec(`ALTER TABLE procurement_requests ADD COLUMN total_cost REAL DEFAULT 0`);
        console.log("Column 'total_cost' added successfully.");
    } catch (e) {
        if (e.message.includes("duplicate column name")) {
            console.log("Column 'total_cost' already exists.");
        } else {
            console.error(e);
        }
    }
})();
