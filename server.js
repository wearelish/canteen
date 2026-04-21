const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/menu', (req, res) => {
    db.all("SELECT * FROM menu_items WHERE available = 1", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/orders', (req, res) => {
    const { student_name, pickup_time, payment_method, total_amount, items } = req.body;
    
    db.run(
        `INSERT INTO orders (student_name, pickup_time, payment_method, total_amount) VALUES (?, ?, ?, ?)`,
        [student_name, pickup_time, payment_method, total_amount],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const orderId = this.lastID;
            const stmt = db.prepare("INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES (?, ?, ?)");
            
            items.forEach(item => {
                stmt.run(orderId, item.menu_item_id, item.quantity);
            });
            stmt.finalize();
            
            res.json({ success: true, orderId: orderId });
        }
    );
});

// Admin API
app.get('/api/admin/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/admin/orders/:id/status', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, changes: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
