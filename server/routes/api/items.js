import { Router } from 'express';
import { db } from '../../db.js';
import authenticateToken from '../../middleware/auth.js';

const router = Router();

const requirePrivileged = (req, res, next) => {
  if (req.user.role !== "Privileged" && req.user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// Route to search for items based on query parameters
router.get('/search-item', authenticateToken, async (req, res) => {
    try {

        // Validate query parameters
        if (!req.query.q || !req.query.v) {
            throw new Error('Missing search query');
        }

        // Extracting search term and column from query parameters
        const searchTerm = req.query.v;
        const column = req.query.q;

        // Initialize SQL query and placeholders based on the search column
        let sql, placeholders;

        // Construct SQL query based on the specified column
        if (['itemNumber'].includes(column)) {

            // For SKU and UPC, we want to search for an exact match
            sql = 'SELECT Items.sku, Items.description FROM Items WHERE sku = ? OR upc = ?';
            placeholders = [searchTerm, searchTerm];
        } else if (['description', 'model', 'brand'].includes(column)) {

            // For description, model, and brand, we want to search for a partial match using LIKE
            sql = `SELECT Items.sku, Items.description FROM Items WHERE ${column} LIKE ?`;
            placeholders = [`%${searchTerm}%`];
        }

        // Execute the SQL query with the appropriate placeholders
        const [rows, fields] = await db.query(sql, placeholders);

        // Check if no results were found
        if (rows.length === 0) {
            res.json({ found: false, message: 'No results found' });
            return;
        }

        if (rows.length === 1) {
            // If exactly one item is found, query for the remaining details of that item
            const itemSql = 'SELECT *, (Items.orderQuantity + Items.availableQuantity) as totalQuantity FROM Items WHERE sku = ?';
            const [itemRows] = await db.query(itemSql, [rows[0].sku]);
            res.json({ found: true, items: itemRows });
        } else {

            // If multiple items are found, return only the SKU and description for each item to populate the selection list
            res.json({ found: true, items: rows });
        }

    } catch (err) {
        console.error('Error executing search query:', err);
        res.status(500).send('Error executing search query');
    }
});

// Route to create a new item
// Expected request body: {
//   upc: '12345',
//   description: 'Sample item description',
//   model: 'Sample model',
//   brand: 'Sample brand',
//   price: '19.99'
// }
router.post('/create-item', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { upc, description, model, brand, price } = req.body;

        // Validate required fields
        if (!upc || !description || !model || !brand || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate price
        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber) || priceNumber < 0) {
            return res.status(400).json({ error: 'Invalid price' });
        }

        // Check if an item with the same UPC already exists
        const [existingItems] = await db.query('SELECT * FROM Items WHERE upc = ?', [upc]);
        if (existingItems.length > 0) {
            return res.status(400).json({ error: 'Item with the same UPC already exists' });
        }

        // Insert the new item into the database
        const sql = 'INSERT INTO Items (upc, description, model, brand, price) VALUES (?, ?, ?, ?, ?)';
        const placeholders = [upc, description, model, brand, price];

        const [result] = await db.query(sql, placeholders);

        res.status(201).json({ message: 'Item created successfully', itemId: result.insertId });

    } catch (err) {
        console.error('Error creating item:', err);
        res.status(500).send('Error creating item');
    }
});

// Route to modify an existing item
// Expected request body: {
//   upc: '12345',
//   description: 'Updated item description',
//   model: 'Updated model',
//   brand: 'Updated brand',
//   price: '29.99'
// }
router.put('/modify-item', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { upc, description, model, brand, price } = req.body;

        // Validate required fields
        if (!upc || !description || !model || !brand || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate price
        const priceNumber = parseFloat(price);
        if (isNaN(priceNumber) || priceNumber < 0) {
            return res.status(400).json({ error: 'Invalid price' });
        }

        // Check if the item exists
        const [existingItems] = await db.query('SELECT * FROM Items WHERE upc = ?', [upc]);
        if (existingItems.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Update the item in the database
        const sql = 'UPDATE Items SET description = ?, model = ?, brand = ?, price = ? WHERE upc = ?';
        const placeholders = [description, model, brand, price, upc];

        await db.query(sql, placeholders);

        res.status(200).json({ message: 'Item modified successfully' });

    } catch (err) {
        console.error('Error modifying item:', err);
        res.status(500).send('Error modifying item');
    }
});


export default router;