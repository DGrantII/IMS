import { Router } from 'express';
import { db } from '../../db.js';
import { authenticateToken, requirePrivileged } from '../../middleware/auth.js';

const router = Router();

// Route to search for adjustments based on query parameters
// Supports two search scenarios:
// 1. By adjustment number: ?adjustmentNumber=123
// 2. By combination of SKU/UPC, status, and create date range: ?itemNumber=456&status=Suspended&createDateStart=2026-04-01&createDateEnd=2026-04-10
router.get('/search-adjustment', authenticateToken, requirePrivileged, async (req, res) => {
    try {
        const { adjustmentNumber, createDateStart, createDateEnd, status, itemNumber } = req.query;

        let sql;
        let placeholders = [];

        // Scenario 1: Search by adjustment number
        if (adjustmentNumber) {
            sql = `
                SELECT
                    InventoryAdjustments.*,
                    COUNT(InventoryAdjustmentItems.sku) AS itemCount,
                    SUM(InventoryAdjustmentItems.cost) AS totalCost
                FROM InventoryAdjustments
                LEFT JOIN InventoryAdjustmentItems ON InventoryAdjustments.inventoryAdjustmentID = InventoryAdjustmentItems.inventoryAdjustmentID
                WHERE InventoryAdjustments.inventoryAdjustmentID = ?
                GROUP BY InventoryAdjustments.inventoryAdjustmentID
            `;
            placeholders = [adjustmentNumber];
        }

        // Scenario 2: Search by combination of SKU/UPC, status, and create date range
        else if (itemNumber || status || createDateStart || createDateEnd) {
            let whereConditions = [];

            // Build dynamic WHERE clause
            if (itemNumber) {
                whereConditions.push('(Items.upc = ? OR Items.sku = ?)');
                placeholders.push(itemNumber, itemNumber);
            }
            if (status) {
                whereConditions.push('InventoryAdjustments.status = ?');
                placeholders.push(status);
            }
            if (createDateStart && createDateEnd) {
                whereConditions.push('InventoryAdjustments.createDate BETWEEN ? AND ?');
                placeholders.push(createDateStart, createDateEnd);
            } else if (createDateStart) {
                whereConditions.push('InventoryAdjustments.createDate >= ?');
                placeholders.push(createDateStart);
            } else if (createDateEnd) {
                whereConditions.push('InventoryAdjustments.createDate <= ?');
                placeholders.push(createDateEnd);
            }

            if (whereConditions.length === 0) {
                throw new Error('At least one search parameter must be provided');
            }

            sql = `
                SELECT DISTINCT 
                    InventoryAdjustments.*,
                    COUNT(InventoryAdjustmentItems.sku) AS itemCount,
                    SUM(InventoryAdjustmentItems.cost) AS totalCost
                FROM InventoryAdjustments
                JOIN InventoryAdjustmentItems ON InventoryAdjustments.inventoryAdjustmentID = InventoryAdjustmentItems.inventoryAdjustmentID
                JOIN Items ON InventoryAdjustmentItems.sku = Items.sku
                WHERE ${whereConditions.join(' AND ')}
                GROUP BY InventoryAdjustments.inventoryAdjustmentID
                ORDER BY InventoryAdjustments.createDate DESC
            `;
        } else {
            throw new Error('At least one search parameter must be provided');
        }

        const [rows] = await db.query(sql, placeholders);

        // Check if no results were found
        if (rows.length === 0) {
            res.json({ message: 'No adjustments found matching the search criteria.', found: false });
            return;
        }

        if (rows.length === 1) {
            // If only one adjustment is found, fetch its details
            const adjustmentItemsSql = `
                SELECT
                    Items.sku,
                    Items.upc,
                    Items.description,
                    Items.price,
                    (Items.availableQuantity + Items.orderQuantity) AS quantityBefore,
                    (Items.availableQuantity + Items.orderQuantity + InventoryAdjustmentItems.variance) AS quantityAfter,
                    InventoryAdjustmentItems.variance,
                    InventoryAdjustmentItems.cost
                FROM InventoryAdjustmentItems
                JOIN Items ON InventoryAdjustmentItems.sku = Items.sku
                WHERE InventoryAdjustmentItems.inventoryAdjustmentID = ?

            `;
            const [items] = await db.query(adjustmentItemsSql, [rows[0].inventoryAdjustmentID]);
            res.json({found: true, adjustments: rows, items: items });
        } else {
            // If multiple adjustments are found, return the list without item details
            res.json({found: true, adjustments: rows });
        }
        
    } catch (err) {
        console.error('Error executing search query:', err);
        res.status(500).send('Error executing search query');
    }
});

// Route to complete an adjustment (update status to "Completed" and adjust inventory quantities accordingly)
// Expected request body: { adjustmentNumber: "123", adjustmentItems: [{ sku: "ABC123", variance: 5, cost: 50.00 }] }
router.post('/complete-adjustment', authenticateToken, requirePrivileged, async (req, res) => {
    const { adjustmentNumber, adjustmentItems, adjustmentReason } = req.body;
    try {
        // Start a transaction
        await db.beginTransaction();

        // Update the inventory quantities
        for (const item of adjustmentItems) {
            await db.query(
                'UPDATE Items SET availableQuantity = availableQuantity + ? WHERE sku = ?',
                [item.variance, item.sku]
            );

            await db.query(
                'UPDATE InventoryAdjustmentItems SET variance = ?, cost = ? WHERE inventoryAdjustmentID = ? AND sku = ?',
                [item.variance, item.cost, adjustmentNumber, item.sku]
            );
        }

        // Update the adjustment status to "Completed" and who completed it
        await db.query(
            'UPDATE InventoryAdjustments SET status = ?, adjustedBy = ?, reason = ?, completeDate = NOW() WHERE inventoryAdjustmentID = ?',
            ['Completed', req.user.employeeID, adjustmentReason, adjustmentNumber]
        );

        // Commit the transaction
        await db.commit();

        res.json({ success: true });
    } catch (error) {
        console.error('Error completing adjustment:', error);
        await db.rollback();
        res.status(500).json({ success: false, message: 'Error completing adjustment' });
    }
});

// Route to delete an adjustment (removing it entirely from the database)
router.post('/delete-adjustment', authenticateToken, requirePrivileged, async (req, res) => {
    const { adjustmentNumber } = req.body;
    try {

        // Check if adjustment is suspended (will not delete completed adjustments)
        const [adjustment] = await db.query(
            'SELECT status FROM InventoryAdjustments WHERE inventoryAdjustmentID = ?',
            [adjustmentNumber]
        );

        if (adjustment.length === 0) {
            res.status(404).json({ success: false, message: 'Adjustment not found' });
            return;
        }

        if (adjustment[0].status === 'Completed') {
            res.status(400).json({ success: false, message: 'Cannot delete a completed adjustment' });
            return;
        }

        // Start a transaction
        await db.beginTransaction();

        // Delete the adjustment items
        await db.query(
            'DELETE FROM InventoryAdjustmentItems WHERE inventoryAdjustmentID = ?',
            [adjustmentNumber]
        );

        // Delete the adjustment
        await db.query(
            'DELETE FROM InventoryAdjustments WHERE inventoryAdjustmentID = ?',
            [adjustmentNumber]
        );

        // Commit the transaction
        await db.commit();

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting adjustment:', error);
        await db.rollback();
        res.status(500).json({ success: false, message: 'Error deleting adjustment' });
    }
});

// Route to suspend an adjustment (update inventory ajustment items without changing inventory quantities)
// Expected request body: { adjustmentNumber: "123", adjustmentItems: [{ sku: "ABC123", variance: 5, cost: 50.00 }] }
router.post('/suspend-adjustment', authenticateToken, requirePrivileged, async (req, res) => {
    const { adjustmentNumber, adjustmentItems, adjustmentReason } = req.body;
    try {
        // Start a transaction
        await db.beginTransaction();

        // Update the inventory adjustment items without changing inventory quantities
        for (const item of adjustmentItems) {
            await db.query(
                'UPDATE InventoryAdjustmentItems SET variance = ?, cost = ? WHERE inventoryAdjustmentID = ? AND sku = ?',
                [item.variance, item.cost, adjustmentNumber, item.sku]
            );
        }

        // Update the adjustment status to "Suspended"
        await db.query(
            'UPDATE InventoryAdjustments SET status = ?, reason = ? WHERE inventoryAdjustmentID = ?',
            ['Suspended', adjustmentReason, adjustmentNumber]
        );

        // Commit the transaction
        await db.commit();

        res.json({ success: true });

    } catch (error) {
        console.error('Error suspending adjustment:', error);
        await db.rollback();
        res.status(500).json({ success: false, message: 'Error suspending adjustment' });
    }
});

// Route to create a new adjustment
// Expected request body: { 
//  reason: "A reason",
//  status: "Either 'Suspended' or 'Completed'",
//  adjustmentItems: [{ sku: "ABC123", variance: 5, cost: 50.00 }] }
router.post('/create-adjustment', authenticateToken, requirePrivileged, async (req, res) => {
    const { reason, status, adjustmentItems } = req.body;

    try {
        // Start a transaction
        await db.beginTransaction();

        // Insert the new adjustment
        const result = await db.query(
            `INSERT INTO InventoryAdjustments (reason, status, createDate, adjustedBy)
            VALUES (?, ?, NOW(), ?)`,
            [reason, status, req.user.employeeID]
        );

        const adjustmentNumber = result[0].insertId;

        // Insert the adjustment items
        for (const item of adjustmentItems) {
            await db.query(
                `INSERT INTO InventoryAdjustmentItems (inventoryAdjustmentID, sku, variance, cost)
                VALUES (?, ?, ?, ?)`,
                [adjustmentNumber, item.sku, item.variance, item.cost]
            );
        }

        // If the adjustment status is "Completed", update the inventory quantities and set the complete date
        if (status.toLowerCase() === 'completed') {
            await db.query(
                'UPDATE InventoryAdjustments SET completeDate = NOW() WHERE inventoryAdjustmentID = ?',
                [adjustmentNumber]
            );
            
            for (const item of adjustmentItems) {
                await db.query(
                    'UPDATE Items SET AvailableQuantity = AvailableQuantity + ? WHERE sku = ?',
                    [item.variance, item.sku]
                );
            }
        }

        // Commit the transaction
        await db.commit();

        res.json({ success: true, adjustmentNumber });

    } catch (error) {
        console.error('Error creating adjustment:', error);
        await db.rollback();
        res.status(500).json({ success: false, message: 'Error creating adjustment' });
    }

});

export default router;