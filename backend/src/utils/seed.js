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
  { id: 5, name: "Denim Jeans (32)", category_id: 2 },
  { id: 6, name: "Basmati Rice (5kg)", category_id: 3 },
  { id: 7, name: "Olive Oil (1L)", category_id: 3 },
  { id: 8, name: "Cordless Drill", category_id: 4 },
  { id: 9, name: "Wrench Set", category_id: 4 },
  { id: 10, name: "A4 Paper (500 sheets)", category_id: 5 },
];

const stockRows = [
  { product_id: 1, warehouse_id: 1, quantity: 4, reorder_level: 10 },
  { product_id: 1, warehouse_id: 2, quantity: 35, reorder_level: 10 },
  { product_id: 2, warehouse_id: 1, quantity: 25, reorder_level: 10 },
  { product_id: 2, warehouse_id: 2, quantity: 18, reorder_level: 10 },
  { product_id: 3, warehouse_id: 1, quantity: 40, reorder_level: 8 },
  { product_id: 3, warehouse_id: 2, quantity: 3, reorder_level: 8 },
  { product_id: 4, warehouse_id: 1, quantity: 6, reorder_level: 15 },
  { product_id: 4, warehouse_id: 2, quantity: 45, reorder_level: 15 },
  { product_id: 5, warehouse_id: 1, quantity: 20, reorder_level: 10 },
  { product_id: 5, warehouse_id: 2, quantity: 22, reorder_level: 10 },
  { product_id: 6, warehouse_id: 1, quantity: 8, reorder_level: 20 },
  { product_id: 6, warehouse_id: 2, quantity: 65, reorder_level: 20 },
  { product_id: 7, warehouse_id: 1, quantity: 3, reorder_level: 15 },
  { product_id: 7, warehouse_id: 2, quantity: 5, reorder_level: 15 },
  { product_id: 8, warehouse_id: 1, quantity: 12, reorder_level: 10 },
  { product_id: 8, warehouse_id: 2, quantity: 14, reorder_level: 10 },
  { product_id: 9, warehouse_id: 1, quantity: 30, reorder_level: 10 },
  { product_id: 9, warehouse_id: 2, quantity: 2, reorder_level: 10 },
  { product_id: 10, warehouse_id: 1, quantity: 50, reorder_level: 100 },
  { product_id: 10, warehouse_id: 2, quantity: 300, reorder_level: 100 },
];

export const ensureSeedData = async () => {
  const [existingCategories, existingWarehouses, existingProducts, existingStock] = await Promise.all([
    Category.findAll({ attributes: ["id"] }),
    Warehouse.findAll({ attributes: ["id"] }),
    Product.findAll({ attributes: ["id"] }),
    Stock.findAll({ attributes: ["product_id", "warehouse_id"] }),
  ]);

  const categoryIds = new Set(existingCategories.map((item) => item.id));
  const warehouseIds = new Set(existingWarehouses.map((item) => item.id));
  const productIds = new Set(existingProducts.map((item) => item.id));
  const stockKeys = new Set(
    existingStock.map((item) => `${item.product_id}-${item.warehouse_id}`)
  );

  const missingCategories = categories.filter((item) => !categoryIds.has(item.id));
  const missingWarehouses = warehouses.filter((item) => !warehouseIds.has(item.id));
  const missingProducts = products.filter((item) => !productIds.has(item.id));
  const missingStock = stockRows.filter(
    (item) => !stockKeys.has(`${item.product_id}-${item.warehouse_id}`)
  );

  if (missingCategories.length > 0) {
    await Category.bulkCreate(missingCategories);
  }

  if (missingWarehouses.length > 0) {
    await Warehouse.bulkCreate(missingWarehouses);
  }

  if (missingProducts.length > 0) {
    await Product.bulkCreate(missingProducts);
  }

  if (missingStock.length > 0) {
    await Stock.bulkCreate(missingStock);
  }
};
