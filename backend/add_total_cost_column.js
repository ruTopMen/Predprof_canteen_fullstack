const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.run("ALTER TABLE procurement_requests ADD COLUMN total_cost REAL DEFAULT 0", (err) => {
        if (err) {
            console.log("Column might already exist or error:", err.message);
        } else {
            console.log("Column 'total_cost' added successfully.");
        }
    });
});

db.close();
