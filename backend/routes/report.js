const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

/**
 * GET /api/report/shortages
 *
 * Returns every warehouse-product pair where quantity < reorder_level.
 * For each shortage row, suggests the OTHER warehouse as a transfer source
 * IF that warehouse has quantity > reorder_level (i.e., has surplus).
 *
 * Optimisation guarantee: exactly 1 SQL query – no per-product looping in JS.
 *
 * Strategy:
 *   – Self-join on `stock` (alias s = shortage side, s2 = other warehouse)
 *   – LEFT JOIN s2 so rows where neither warehouse has surplus still appear
 *   – The WHERE clause restricts to shortage rows only
 *   – All joins are keyed on indexed columns (product_id, warehouse_id)
 */
router.get('/', async (req, res) => {
  try {
    // ── Query 1 of 1 ─────────────────────────────────────────────────────────
    const [shortages] = await pool.query(`
      SELECT
        p.id                              AS product_id,
        p.name                            AS product_name,
        c.name                            AS category,

        /* Shortage warehouse */
        w_short.id                        AS shortage_warehouse_id,
        w_short.name                      AS shortage_warehouse_name,
        s.quantity                        AS current_qty,
        s.reorder_level                   AS reorder_level,
        (s.reorder_level - s.quantity)    AS deficit,

        /* Suggested source warehouse (NULL if no surplus available) */
        w_src.id                          AS suggested_source_id,
        w_src.name                        AS suggested_source_name,
        s2.quantity                       AS source_qty,
        (s2.quantity - s2.reorder_level)  AS transferable_qty

      FROM products      p
      JOIN categories    c       ON  c.id  = p.category_id

      /* Shortage side */
      JOIN stock         s       ON  s.product_id   = p.id
      JOIN warehouses    w_short ON  w_short.id     = s.warehouse_id

      /* Other warehouse – LEFT JOIN so we still get rows with no surplus */
      LEFT JOIN stock    s2      ON  s2.product_id  = p.id
                                 AND s2.warehouse_id != s.warehouse_id
                                 AND s2.quantity     > s2.reorder_level
      LEFT JOIN warehouses w_src ON  w_src.id = s2.warehouse_id

      WHERE s.quantity < s.reorder_level

      ORDER BY deficit DESC, p.name, s.warehouse_id
    `);
    // ─────────────────────────────────────────────────────────────────────────

    res.json({
      success: true,
      total:   shortages.length,
      data:    shortages,
    });
  } catch (err) {
    console.error('[GET /api/report/shortages]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch shortage report', error: err.message });
  }
});

module.exports = router;
