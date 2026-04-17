import { sequelize } from "../config/db.js";
import { Category, Product, Stock, Warehouse } from "../models/index.js";
import { ensureSeedData } from "../utils/seed.js";

const run = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureSeedData();

    const [categories, warehouses, products, stockRows] = await Promise.all([
      Category.count(),
      Warehouse.count(),
      Product.count(),
      Stock.count(),
    ]);

    console.log("Seed complete.");
    console.log(`Categories: ${categories}`);
    console.log(`Warehouses: ${warehouses}`);
    console.log(`Products: ${products}`);
    console.log(`Stock rows: ${stockRows}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
