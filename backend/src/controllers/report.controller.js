import { sequelize } from "../config/db.js";

export const getShortages = async (req, res) => {
  console.log("Checking sequelize instance:", typeof sequelize);
  
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
        CASE 
          WHEN (COALESCE(sA.quantity,0) < COALESCE(sA.reorder_level,0) OR COALESCE(sB.quantity,0) < COALESCE(sB.reorder_level,0)) 
          THEN 'Shortage' 
          ELSE 'OK' 
        END AS status,

        -- Suggested transfer
        CASE
          WHEN COALESCE(sA.quantity,0) < COALESCE(sA.reorder_level,0) AND COALESCE(sB.quantity,0) > COALESCE(sB.reorder_level,0) THEN 2
          WHEN COALESCE(sB.quantity,0) < COALESCE(sB.reorder_level,0) AND COALESCE(sA.quantity,0) > COALESCE(sA.reorder_level,0) THEN 1
        END AS suggested_from_warehouse_id,

        CASE
          WHEN COALESCE(sA.quantity,0) < COALESCE(sA.reorder_level,0) AND COALESCE(sB.quantity,0) > COALESCE(sB.reorder_level,0) THEN 1
          WHEN COALESCE(sB.quantity,0) < COALESCE(sB.reorder_level,0) AND COALESCE(sA.quantity,0) > COALESCE(sA.reorder_level,0) THEN 2
        END AS suggested_to_warehouse_id,

        -- Quantity
        CASE
          WHEN COALESCE(sA.quantity,0) < COALESCE(sA.reorder_level,0) AND COALESCE(sB.quantity,0) > COALESCE(sB.reorder_level,0)
            THEN LEAST(COALESCE(sA.reorder_level,0) - COALESCE(sA.quantity,0), COALESCE(sB.quantity,0) - COALESCE(sB.reorder_level,0))

          WHEN COALESCE(sB.quantity,0) < COALESCE(sB.reorder_level,0) AND COALESCE(sA.quantity,0) > COALESCE(sA.reorder_level,0)
            THEN LEAST(COALESCE(sB.reorder_level,0) - COALESCE(sB.quantity,0), COALESCE(sA.quantity,0) - COALESCE(sA.reorder_level,0))

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
    console.error("REPORT ERROR:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
};