import { Router } from 'express';
import { db } from '../../db.js';
import authenticateToken from '../../middleware/auth.js';

const router = Router();

function requirePrivileged(req, res, next) {
  if (req.user.role !== "Privileged") {
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
        } else {

            // If the column is not valid, throw an error
            throw new Error('Invalid search column');
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

export default router;