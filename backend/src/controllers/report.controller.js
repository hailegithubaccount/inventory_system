export const getShortages = async (req, res) => {
  try {
    const [data] = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        c.name AS category,

        COALESCE(sA.quantity, 0) AS warehouse_a_qty,
        COALESCE(sB.quantity, 0) AS warehouse_b_qty,

        COALESCE(sA.reorder_level, 0) AS warehouse_a_reorder_level,
        COALESCE(sB.reorder_level, 0) AS warehouse_b_reorder_level,

        wa.name AS warehouse_a_name,
        wb.name AS warehouse_b_name,

        -- Status
        IF(
          COALESCE(sA.quantity,0) < COALESCE(sA.reorder_level,0) OR
          COALESCE(sB.quantity,0) < COALESCE(sB.reorder_level,0),
          'Shortage',
          'OK'
        ) AS status,

        -- Suggested transfer
        CASE
          WHEN sA.quantity < sA.reorder_level AND sB.quantity > sB.reorder_level THEN 2
          WHEN sB.quantity < sB.reorder_level AND sA.quantity > sA.reorder_level THEN 1
        END AS from_warehouse_id,

        CASE
          WHEN sA.quantity < sA.reorder_level AND sB.quantity > sB.reorder_level THEN 1
          WHEN sB.quantity < sB.reorder_level AND sA.quantity > sA.reorder_level THEN 2
        END AS to_warehouse_id,

        -- Quantity
        CASE
          WHEN sA.quantity < sA.reorder_level AND sB.quantity > sB.reorder_level
            THEN LEAST(sA.reorder_level - sA.quantity, sB.quantity - sB.reorder_level)

          WHEN sB.quantity < sB.reorder_level AND sA.quantity > sA.reorder_level
            THEN LEAST(sB.reorder_level - sB.quantity, sA.quantity - sA.reorder_level)

          ELSE 0
        END AS suggested_quantity

      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN stock sA ON p.id = sA.product_id AND sA.warehouse_id = 1
      LEFT JOIN stock sB ON p.id = sB.product_id AND sB.warehouse_id = 2
      LEFT JOIN warehouses wa ON wa.id = 1
      LEFT JOIN warehouses wb ON wb.id = 2

      WHERE 
        COALESCE(sA.quantity,0) < COALESCE(sA.reorder_level,0)
        OR
        COALESCE(sB.quantity,0) < COALESCE(sB.reorder_level,0)
    `);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};