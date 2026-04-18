import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "categories",
    timestamps: false,
  }
);

export const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "products",
    timestamps: false,
  }
);

export const Warehouse = sequelize.define(
  "Warehouse",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "warehouses",
    timestamps: false,
  }
);

export const Stock = sequelize.define(
  "Stock",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reorder_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "stock",
    timestamps: false,
  }
);

export const StockMovement = sequelize.define(
  "StockMovement",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    from_warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    to_warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "stock_movements",
    timestamps: false,
  }
);


Category.hasMany(Product, { foreignKey: "category_id" });
Product.belongsTo(Category, { foreignKey: "category_id" });

Product.hasMany(Stock, { foreignKey: "product_id", as: "stocks" });
Stock.belongsTo(Product, { foreignKey: "product_id" });

Warehouse.hasMany(Stock, { foreignKey: "warehouse_id", as: "stocks" });
Stock.belongsTo(Warehouse, { foreignKey: "warehouse_id", as: "warehouse" });

Product.belongsToMany(Warehouse, {
  through: Stock,
  foreignKey: "product_id",
  otherKey: "warehouse_id",
  as: "warehouses",
});

Warehouse.belongsToMany(Product, {
  through: Stock,
  foreignKey: "warehouse_id",
  otherKey: "product_id",
  as: "products",
});

StockMovement.belongsTo(Product, { foreignKey: "product_id" });
StockMovement.belongsTo(Warehouse, {
  foreignKey: "from_warehouse_id",
  as: "fromWarehouse",
});
StockMovement.belongsTo(Warehouse, {
  foreignKey: "to_warehouse_id",
  as: "toWarehouse",
});
