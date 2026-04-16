const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

/**
 * POST /api/transfer
 *
 * Body: { product_id, from_warehouse_id, to_warehouse_id, quantity }
 *
 * Executes inside a single MySQL transaction:
 *   1. Validates stock exists and source has enough quantity
 *   2. Deducts quantity from source warehouse (stock UPDATE)
 *   3. Adds quantity to destination warehouse (stock UPDATE)
 *   4. Inserts an "out" stock_movement for the source
 *   5. Inserts an "in"  stock_movement for the destination
 *
 * On any failure the transaction is rolled back automatically.
 */
router.post('/', async (req, res) => {
  const { product_id, from_warehouse_id, to_warehouse_id, quantity } = req.body;

  // ── Input validation ───────────────────────────────────────────────────────
  if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: product_id, from_warehouse_id, to_warehouse_id, quantity',
    });
  }
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
  }
  if (from_warehouse_id === to_warehouse_id) {
    return res.status(400).json({ success: false, message: 'Source and destination warehouses must be different' });
  }

  // ── Acquire dedicated connection for transaction ───────────────────────────
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // ── Step 1: Lock both stock rows and validate ──────────────────────────
    const [rows] = await conn.query(
      `SELECT warehouse_id, quantity, reorder_level
       FROM stock
       WHERE product_id = ? AND warehouse_id IN (?, ?)
       FOR UPDATE`,
      [product_id, from_warehouse_id, to_warehouse_id]
    );

    if (rows.length < 2) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Stock records not found for given product and warehouses' });
    }

    const source = rows.find((r) => r.warehouse_id === parseInt(from_warehouse_id));
    const dest   = rows.find((r) => r.warehouse_id === parseInt(to_warehouse_id));

    if (!source) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Source warehouse stock record not found' });
    }
    if (source.quantity < qty) {
      await conn.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient stock in source warehouse. Available: ${source.quantity}, Requested: ${qty}`,
      });
    }

    // ── Step 2: Deduct from source ─────────────────────────────────────────
    await conn.query(
      `UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ?`,
      [qty, product_id, from_warehouse_id]
    );

    // ── Step 3: Add to destination ─────────────────────────────────────────
    await conn.query(
      `UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?`,
      [qty, product_id, to_warehouse_id]
    );

    // ── Step 4: Record "out" movement ─────────────────────────────────────
    await conn.query(
      `INSERT INTO stock_movements (product_id, from_warehouse_id, to_warehouse_id, quantity, type, notes)
       VALUES (?, ?, NULL, ?, 'out', 'Transfer out')`,
      [product_id, from_warehouse_id, qty]
    );

    // ── Step 5: Record "in" movement ──────────────────────────────────────
    await conn.query(
      `INSERT INTO stock_movements (product_id, from_warehouse_id, to_warehouse_id, quantity, type, notes)
       VALUES (?, NULL, ?, ?, 'in', 'Transfer in')`,
      [product_id, to_warehouse_id, qty]
    );

    await conn.commit();

    res.json({
      success: true,
      message: `Successfully transferred ${qty} unit(s) from warehouse ${from_warehouse_id} to warehouse ${to_warehouse_id}`,
      transfer: { product_id, from_warehouse_id, to_warehouse_id, quantity: qty },
    });
  } catch (err) {
    await conn.rollback();
    console.error('[POST /api/transfer]', err);
    res.status(500).json({ success: false, message: 'Transfer failed. Transaction rolled back.', error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
