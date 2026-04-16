const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

/**
 * GET /api/products
 *
 * Lists all products with their stock quantities in both warehouses.
 * Uses a single eager-loading JOIN query (no N+1) with conditional aggregation
 * to pivot warehouse stock into columns: warehouse_a_qty / warehouse_b_qty.
 *
 * Query count: 1 query total.
 */
router.get('/', async (req, res) => {
  try {
    // Single query – eager loads category + both warehouse stock levels
    // CASE WHEN pivots the stock rows into dedicated columns per warehouse.
    const [products] = await pool.query(`
      SELECT
        p.id                                                          AS id,
        p.name                                                        AS name,
        c.id                                                          AS category_id,
        c.name                                                        AS category,
        MAX(CASE WHEN s.warehouse_id = 1 THEN s.quantity      END)   AS warehouse_a_qty,
        MAX(CASE WHEN s.warehouse_id = 2 THEN s.quantity      END)   AS warehouse_b_qty,
        MAX(CASE WHEN s.warehouse_id = 1 THEN s.reorder_level END)   AS reorder_level_a,
        MAX(CASE WHEN s.warehouse_id = 2 THEN s.reorder_level END)   AS reorder_level_b
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stock      s ON s.product_id = p.id
      GROUP BY p.id, p.name, c.id, c.name
      ORDER BY c.name, p.name
    `);

    // Attach computed status per warehouse (no extra query, pure JS map)
    const result = products.map((row) => ({
      ...row,
      status_a: row.warehouse_a_qty < row.reorder_level_a ? 'Shortage' : 'OK',
      status_b: row.warehouse_b_qty < row.reorder_level_b ? 'Shortage' : 'OK',
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[GET /api/products]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: err.message });
  }
});

module.exports = router;
