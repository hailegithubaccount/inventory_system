import { sequelize } from "../config/db.js";
import { Stock, StockMovement } from "../models/index.js";

export const transferStock = async (req, res) => {
  const { product_id, from_warehouse_id, to_warehouse_id, quantity } = req.body;

  if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (from_warehouse_id === to_warehouse_id) {
    return res.status(400).json({
      error: "Source warehouse and destination warehouse must be different.",
    });
  }

  if (Number(quantity) <= 0) {
    return res.status(400).json({ error: "Quantity must be greater than 0." });
  }

  const transaction = await sequelize.transaction();

  try {
    const sourceStock = await Stock.findOne({
      where: {
        product_id,
        warehouse_id: from_warehouse_id,
      },
      transaction,
    });

    const destinationStock = await Stock.findOne({
      where: {
        product_id,
        warehouse_id: to_warehouse_id,
      },
      transaction,
    });

    if (!sourceStock || !destinationStock) {
      await transaction.rollback();
      return res.status(404).json({ error: "Stock record not found." });
    }

    if (sourceStock.quantity < Number(quantity)) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "Not enough stock in the source warehouse." });
    }

    sourceStock.quantity = sourceStock.quantity - Number(quantity);
    destinationStock.quantity = destinationStock.quantity + Number(quantity);

    await sourceStock.save({ transaction });
    await destinationStock.save({ transaction });

    await StockMovement.create(
      {
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity: Number(quantity),
        type: "out",
      },
      { transaction }
    );

    await StockMovement.create(
      {
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity: Number(quantity),
        type: "in",
      },
      { transaction }
    );

    await transaction.commit();

    res.json({
      message: "Transfer completed successfully.",
      product_id,
      from_warehouse_id,
      to_warehouse_id,
      quantity: Number(quantity),
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};
