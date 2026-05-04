import { Router } from 'express';
import { db } from '../../db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = Router();

// Route to get dashboard data
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Obtaining aging manifests (unreceived and over a week old)
        const agingSQL = `
            SELECT manifestNumber FROM Manifests
            WHERE status = 'Shipped'
            AND createDate < NOW() - INTERVAL 7 DAY
        `;
        const [agingManifests] = await db.query(agingSQL);
        
        // Obtaining all suspended inventory adjustments
        const suspendedSQL = `
            SELECT inventoryAdjustmentID FROM InventoryAdjustments
            WHERE status = 'Suspended'
        `;
        const [suspendedAdjustments] = await db.query(suspendedSQL);
        
        // Obtaining monthly shrink (total of all adjustment costs for the month)
        const shrinkSQL = `
            SELECT
                COALESCE(SUM(iai.cost), 0) AS monthlyShrink
            FROM InventoryAdjustments ia
            JOIN InventoryAdjustmentItems iai
                ON iai.InventoryAdjustmentID = ia.InventoryAdjustmentID
            WHERE ia.completeDate >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                AND ia.completeDate < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
                AND ia.status = 'Completed'
        `;
        const [monthlyShrink] = await db.query(shrinkSQL);
        
        res.json({ agingManifests, suspendedAdjustments, monthlyShrink });
        
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).send('Error executing query');
    }
});

export default router;