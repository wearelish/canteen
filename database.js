const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'canteen.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Create Menu Items Table
        db.run(`CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            category TEXT,
            available BOOLEAN DEFAULT 1,
            image_url TEXT
        )`);

        // Create Orders Table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            status TEXT DEFAULT 'pending', -- pending, preparing, ready, completed
            pickup_time TEXT,
            payment_method TEXT,
            total_amount REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Order Items Table
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            menu_item_id INTEGER,
            quantity INTEGER,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
        )`);

        // Insert initial menu items if empty
        db.get("SELECT COUNT(*) as count FROM menu_items", (err, row) => {
            if (row && row.count === 0) {
                const insert = db.prepare("INSERT INTO menu_items (name, description, price, category) VALUES (?, ?, ?, ?)");
                insert.run("Samosa", "Crispy potato-filled pastry", 15, "snacks");
                insert.run("Chai", "Hot spiced tea", 10, "beverages");
                insert.run("Maggi", "Instant noodles", 30, "snacks");
                insert.run("Cold Coffee", "Chilled coffee drink", 45, "beverages");
                insert.run("Veg Sandwich", "Fresh vegetable sandwich", 35, "snacks");
                insert.run("Veg Thali", "Complete meal with rice, roti, dal, sabzi", 80, "meals");
                insert.finalize();
                console.log("Initial menu items seeded.");
            }
        });
    });
}

module.exports = db;
