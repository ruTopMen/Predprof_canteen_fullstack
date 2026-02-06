const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    db.run("ALTER TABLE users ADD COLUMN allergies TEXT", (err) => {
        if (err) {
            console.log("Column 'allergies' might already exist or error:", err.message);
        } else {
            console.log("Column 'allergies' added successfully.");
        }
    });
});

db.close();
