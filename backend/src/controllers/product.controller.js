import { Category, Product, Stock, Warehouse } from "../models/index.js";

export const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
        {
          model: Stock,
          as: "stocks",
          attributes: ["warehouse_id", "quantity", "reorder_level"],
          include: [
            {
              model: Warehouse,
              as: "warehouse",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [
        ["id", "ASC"],
        [{ model: Stock, as: "stocks" }, "warehouse_id", "ASC"],
      ],
    });

    const rows = products.map((product) => {
      const warehouseA = product.stocks.find((stock) => stock.warehouse_id === 1);
      const warehouseB = product.stocks.find((stock) => stock.warehouse_id === 2);

      const warehouseAQty = warehouseA ? warehouseA.quantity : 0;
      const warehouseBQty = warehouseB ? warehouseB.quantity : 0;
      const warehouseAReorder = warehouseA ? warehouseA.reorder_level : 0;
      const warehouseBReorder = warehouseB ? warehouseB.reorder_level : 0;

      return {
        id: product.id,
        name: product.name,
        category: product.Category ? product.Category.name : null,
        warehouse_a_name: warehouseA?.warehouse?.name || "Warehouse A",
        warehouse_b_name: warehouseB?.warehouse?.name || "Warehouse B",
        warehouse_a_qty: warehouseAQty,
        warehouse_b_qty: warehouseBQty,
        warehouse_a_reorder_level: warehouseAReorder,
        warehouse_b_reorder_level: warehouseBReorder,
        reorder_level: warehouseAReorder || warehouseBReorder,
        status:
          warehouseAQty < warehouseAReorder || warehouseBQty < warehouseBReorder
            ? "Shortage"
            : "OK",
      };
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
