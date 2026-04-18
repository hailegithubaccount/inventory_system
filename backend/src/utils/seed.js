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
  { product_id: 1, warehouse_id: 2, quantity: 7, reorder_level: 10 },
  { product_id: 2, warehouse_id: 1, quantity: 25, reorder_level: 10 },
  { product_id: 2, warehouse_id: 2, quantity: 18, reorder_level: 10 },
  { product_id: 3, warehouse_id: 1, quantity: 40, reorder_level: 8 },
  
  
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
