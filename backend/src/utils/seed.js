import { Category, Product, Stock, Warehouse } from "../models/index.js";

const categories = [
  { id: 1, name: "Electronics" },
  { id: 2, name: "Clothing" },
  { id: 3, name: "Food & Beverage" },
  { id: 4, name: "Tools & Hardware" },
  { id: 5, name: "Office Supplies" },
];

const warehouses = [
  { id: 1, name: "Warehouse A" },
  { id: 2, name: "Warehouse B" },
];

const products = [
  { id: 1, name: 'Laptop Pro 15"', category_id: 1 },
  { id: 2, name: "Wireless Mouse", category_id: 1 },
  { id: 3, name: "USB-C Hub", category_id: 1 },
  { id: 4, name: "Cotton T-Shirt (L)", category_id: 2 },
  
];

const stockRows = [
  { product_id: 1, warehouse_id: 1, quantity: 4, reorder_level: 10 },
  { product_id: 1, warehouse_id: 2, quantity: 35, reorder_level: 10 },
  { product_id: 2, warehouse_id: 1, quantity: 25, reorder_level: 10 },
  { product_id: 2, warehouse_id: 2, quantity: 5, reorder_level: 10 },
  { product_id: 3, warehouse_id: 1, quantity: 40, reorder_level: 8 },
  { product_id: 3, warehouse_id: 2, quantity: 2, reorder_level: 8 },
  { product_id: 4, warehouse_id: 1, quantity: 6, reorder_level: 15 },
  { product_id: 4, warehouse_id: 2, quantity: 45, reorder_level: 15 },
];

export const ensureSeedData = async () => {
  // 1. Categories
  for (const cat of categories) {
    await Category.findOrCreate({
      where: { id: cat.id },
      defaults: cat,
    });
  }

  // 2. Warehouses
  for (const wh of warehouses) {
    await Warehouse.findOrCreate({
      where: { id: wh.id },
      defaults: wh,
    });
  }

  // 3. Products
  for (const prod of products) {
    await Product.findOrCreate({
      where: { id: prod.id },
      defaults: prod,
    });
  }

  // 4. Stock (Force update quantities from seed)
  for (const row of stockRows) {
    const [stock, created] = await Stock.findOrCreate({
      where: {
        product_id: row.product_id,
        warehouse_id: row.warehouse_id,
      },
      defaults: row,
    });

    if (!created) {
      // If already exists, update it to match the seed file
      await stock.update({
        quantity: row.quantity,
        reorder_level: row.reorder_level,
      });
    }
  }
};
