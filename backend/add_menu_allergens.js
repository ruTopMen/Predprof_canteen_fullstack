const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.run("ALTER TABLE menu ADD COLUMN allergens TEXT", (err) => {
        if (err) {
            console.log("Column 'allergens' might already exist or error:", err.message);
        } else {
            console.log("Column 'allergens' added successfully to menu.");
        }
    });
});

db.close();
