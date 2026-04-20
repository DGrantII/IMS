import { Router } from 'express';
import { db } from '../../db.js';
import authenticateToken from '../../middleware/auth.js';

const router = Router();

function requirePrivileged(req, res, next) {
  if (req.user.role !== "Privileged" && req.user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// Route to search for manifests based on query parameters
// Supports three search scenarios:
// 1. By manifest number: ?manifestNumber=123
// 2. By tracking number: ?trackingNumber=ABC123
// 3. By combination of SKU/UPC, status, and create date range: ?itemNumber=456&status=shipped&createDateStart=2026-04-01&createDateEnd=2026-04-10
router.get('/search-manifest', authenticateToken, async (req, res) => {
    try {
        const { manifestNumber, trackingNumber, itemNumber, status, createDateStart, createDateEnd } = req.query;

        let sql;
        let placeholders = [];

        // Scenario 1: Search by manifest number
        if (manifestNumber) {
            sql = `
                SELECT Manifests.*, COUNT(ManifestItems.sku) as itemCount
                FROM Manifests
                LEFT JOIN ManifestItems ON Manifests.manifestNumber = ManifestItems.manifestNumber
                WHERE Manifests.manifestNumber = ?
                GROUP BY Manifests.manifestNumber
            `;
            placeholders = [manifestNumber];
        }
        // Scenario 2: Search by tracking number
        else if (trackingNumber) {
            sql = `
                SELECT Manifests.*, COUNT(ManifestItems.sku) as itemCount
                FROM Manifests
                LEFT JOIN ManifestItems ON Manifests.manifestNumber = ManifestItems.manifestNumber
                WHERE Manifests.trackingNumber = ?
                GROUP BY Manifests.manifestNumber
            `;
            placeholders = [trackingNumber];
        }
        // Scenario 3: Search by combination of SKU/UPC, status, and create date range
        else if (itemNumber || status || createDateStart || createDateEnd) {
            let whereConditions = [];
            
            // Build dynamic WHERE clause
            if (itemNumber) {
                whereConditions.push('(Items.upc = ? OR Items.sku = ?)');
                placeholders.push(itemNumber);
                placeholders.push(itemNumber);
            }
            if (status) {
                whereConditions.push('Manifests.status = ?');
                placeholders.push(status);
            }
            if (createDateStart && createDateEnd) {
                whereConditions.push('Manifests.createDate BETWEEN ? AND ?');
                placeholders.push(createDateStart);
                placeholders.push(createDateEnd);
            } else if (createDateStart) {
                whereConditions.push('Manifests.createDate >= ?');
                placeholders.push(createDateStart);
            } else if (createDateEnd) {
                whereConditions.push('Manifests.createDate <= ?');
                placeholders.push(createDateEnd);
            }

            if (whereConditions.length === 0) {
                throw new Error('At least one search parameter is required');
            }

            sql = `
                SELECT DISTINCT Manifests.*, COUNT(ManifestItems.sku) as itemCount
                FROM Manifests
                JOIN ManifestItems ON Manifests.manifestNumber = ManifestItems.manifestNumber
                JOIN Items ON ManifestItems.sku = Items.sku
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY Manifests.manifestNumber
                ORDER BY Manifests.createDate DESC
            `;
        } else {
            throw new Error('At least one search parameter is required');
        }

        const [rows] = await db.query(sql, placeholders);

        // Check if no results were found
        if (rows.length === 0) {
            res.json({ message: 'No results found' });
            return;
        }

        if (rows.length === 1) {
            // If exactly one manifest is found, query for the items included in that manifest
            const manifestItemsSql = `
                SELECT Items.sku, Items.upc, Items.description, ManifestItems.quantity
                FROM ManifestItems
                JOIN Items ON ManifestItems.sku = Items.sku
                WHERE ManifestItems.manifestNumber = ?
            `;
            const [items] = await db.query(manifestItemsSql, [rows[0].manifestNumber]);
            res.json({ found: true, manifests: rows, items: items });
        } else {
            // If multiple manifests are found, simply return the manifest details without the included items to populate the selection list
            res.json({found: true, manifests: rows});
        }

    } catch (err) {
        console.error('Error executing search query:', err);
        res.status(500).send('Error executing search query');
    }
});

// Route to receive a manifest (update status to "Received" and adjust inventory quantities accordingly)
// Expected request body: { manifestNumber: "123", variances: [{ sku: "456", expectedQuantity: 10, actualQuantity: 8 }] }
router.post('/receive-manifest', authenticateToken, async (req, res) => {
    try {
        const { manifestNumber } = req.body;
        if (!manifestNumber) {
            return res.status(400).json({ error: 'Manifest number is required' });
        }

        // Start transaction
        await db.beginTransaction();

        // Update manifest status to "Received"
        const updateManifestSql = 'UPDATE Manifests SET status = "Received", receiveDate = NOW(), receivedBy = ? WHERE manifestNumber = ?';
        await db.query(updateManifestSql, [req.user.employeeID, manifestNumber]);

        // Get items included in the manifest
        const manifestItemsSql = 'SELECT sku, quantity FROM ManifestItems WHERE manifestNumber = ?';
        const [manifestItems] = await db.query(manifestItemsSql, [manifestNumber]);

        // Update inventory quantities for each item in the manifest
        for (const item of manifestItems) {
            const updateItemSql = 'UPDATE Items SET availableQuantity = availableQuantity + ?, inTransit = inTransit - ? WHERE sku = ?';
            await db.query(updateItemSql, [item.quantity, item.quantity, item.sku]);
        }

        // If variances are provided, create a suspended inventory adjustment for each variance
        if (req.body.variances && Array.isArray(req.body.variances)) {

            // Creating inventory adjustment and retrieving the generated adjustment ID for linking adjustment items
            const insertAdjustmentSql = `
                INSERT INTO InventoryAdjustments (status, reason, createDate, adjustedBy)
                VALUES ("Suspended", "Variance on manifest receipt", NOW(), ?)
            `;
            const [adjustmentResult] = await db.query(insertAdjustmentSql, [req.user.employeeID]);
            const adjustmentId = adjustmentResult.insertId;

            // Creating inventory adjustment items for each variance
            for (const variance of req.body.variances) {

                // Obtaining variance quantity (positive for overages, negative for shortages)
                const { sku, expectedQuantity, actualQuantity } = variance;
                const varianceQuantity = actualQuantity - expectedQuantity;

                // Getting cost of the item for accurate adjustment records
                const itemCostSql = 'SELECT price FROM Items WHERE sku = ?';
                const [itemRows] = await db.query(itemCostSql, [sku]);
                const price = itemRows.length > 0 ? itemRows[0].price : 0;
                const varianceCost = price * varianceQuantity;

                // Insert inventory adjustment item record
                if (varianceQuantity !== 0) {
                    const insertAdjustmentItemSql = `
                        INSERT INTO InventoryAdjustmentItems (inventoryAdjustmentID, sku, variance, cost)
                        VALUES (?, ?, ?, ?)
                    `;
                    await db.query(insertAdjustmentItemSql, [adjustmentId, sku, varianceQuantity, varianceCost]);
                }
            }
        }

        // Commit transaction
        await db.commit();

        res.json({ success: true, message: 'Manifest received successfully' });
    } catch (err) {

        // Rollback transaction in case of error
        await db.rollback();
        console.error('Error receiving manifest:', err);
        res.status(500).json({ error: 'Error receiving manifest' });
    }
});

// Route to create a new manifest
// Expected request body: { trackingNumber: "ABC123", items: [{ sku: "456", quantity: 10 }] }
router.post('/create-manifest', authenticateToken, requirePrivileged, async (req, res) => {
    try {
        let { trackingNumber, items } = req.body;
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'At least one item is required to create a manifest' });
        }

        if (!trackingNumber) {
            trackingNumber = null; // Allow tracking number to be optional
        }
        
        // Start transaction
        await db.beginTransaction();

        // Insert new manifest record
        const insertManifestSql = 'INSERT INTO Manifests (trackingNumber, createDate, status) VALUES (?, NOW(), "Shipped")';
        const [manifestResult] = await db.query(insertManifestSql, [trackingNumber]);
        const manifestNumber = manifestResult.insertId;

        // Insert manifest items
        for (const item of items) {
            const { sku, quantity } = item;
            const insertManifestItemSql = 'INSERT INTO ManifestItems (manifestNumber, sku, quantity) VALUES (?, ?, ?)';
            await db.query(insertManifestItemSql, [manifestNumber, sku, quantity]);
        }

        // Commit transaction
        await db.commit();

        res.json({ message: 'Manifest created successfully', manifestNumber });
    } catch (err) {
        // Rollback transaction in case of error
        await db.rollback();
        console.error('Error creating manifest:', err);
        res.status(500).json({ error: 'Error creating manifest' });
    }
});

export default router;