-- ============================================================
-- Inventory System - Database Schema & Seed Data
-- Date: April 15, 2026
-- ============================================================

CREATE DATABASE IF NOT EXISTS inventory_system;
USE inventory_system;

-- Drop tables in reverse dependency order (re-runable)
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS stock;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS categories;

-- -----------------------------------------------
-- CATEGORIES (many-to-one with products)
-- -----------------------------------------------
CREATE TABLE categories (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- WAREHOUSES (simplified to 2)
-- -----------------------------------------------
CREATE TABLE warehouses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  location      VARCHAR(200)
);

-- -----------------------------------------------
-- PRODUCTS (many-to-one with categories)
-- -----------------------------------------------
CREATE TABLE products (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  category_id   INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- -----------------------------------------------
-- STOCK (many-to-many: products <-> warehouses)
-- -----------------------------------------------
CREATE TABLE stock (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  product_id     INT NOT NULL,
  warehouse_id   INT NOT NULL,
  quantity       INT NOT NULL DEFAULT 0,
  reorder_level  INT NOT NULL DEFAULT 10,
  UNIQUE KEY uq_stock (product_id, warehouse_id),
  FOREIGN KEY (product_id)   REFERENCES products(id)   ON DELETE CASCADE,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);

-- -----------------------------------------------
-- STOCK MOVEMENTS (audit trail for transfers)
-- -----------------------------------------------
CREATE TABLE stock_movements (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  product_id          INT NOT NULL,
  from_warehouse_id   INT,
  to_warehouse_id     INT,
  quantity            INT NOT NULL,
  type                ENUM('in', 'out', 'transfer') NOT NULL,
  notes               VARCHAR(255),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id)          REFERENCES products(id)   ON DELETE CASCADE,
  FOREIGN KEY (from_warehouse_id)   REFERENCES warehouses(id) ON DELETE SET NULL,
  FOREIGN KEY (to_warehouse_id)     REFERENCES warehouses(id) ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO categories (id, name) VALUES
  (1, 'Electronics'),
  (2, 'Clothing'),
  (3, 'Food & Beverage'),
  (4, 'Tools & Hardware'),
  (5, 'Office Supplies');

INSERT INTO warehouses (id, name, location) VALUES
  (1, 'Warehouse A', 'North District'),
  (2, 'Warehouse B', 'South District');

INSERT INTO products (id, name, category_id) VALUES
  (1,  'Laptop Pro 15"',        1),
  (2,  'Wireless Mouse',        1),
  (3,  'USB-C Hub',             1),
  (4,  'Cotton T-Shirt (L)',    2),
  (5,  'Denim Jeans (32)',      2),
  (6,  'Basmati Rice (5kg)',    3),
  (7,  'Olive Oil (1L)',        3),
  (8,  'Cordless Drill',        4),
  (9,  'Wrench Set',            4),
  (10, 'A4 Paper (500 sheets)', 5);

-- Stock: warehouse_id=1 → Warehouse A, warehouse_id=2 → Warehouse B
-- Scenarios: shortages, OK, and both-short
INSERT INTO stock (product_id, warehouse_id, quantity, reorder_level) VALUES
  -- Laptop: shortage in WH-A, excess in WH-B → transfer suggested
  (1, 1,  4,  10),
  (1, 2,  35, 10),

  -- Wireless Mouse: OK in both
  (2, 1,  25, 10),
  (2, 2,  18, 10),

  -- USB-C Hub: shortage in WH-B, excess in WH-A → transfer suggested
  (3, 1,  40, 8),
  (3, 2,  3,  8),

  -- T-Shirt: shortage in WH-A, excess in WH-B
  (4, 1,  6,  15),
  (4, 2,  45, 15),

  -- Denim Jeans: OK in both
  (5, 1,  20, 10),
  (5, 2,  22, 10),

  -- Rice: shortage in WH-A, excess in WH-B
  (6, 1,  8,  20),
  (6, 2,  65, 20),

  -- Olive Oil: both warehouses short (no suggested source)
  (7, 1,  3,  15),
  (7, 2,  5,  15),

  -- Cordless Drill: OK in both
  (8, 1,  12, 10),
  (8, 2,  14, 10),

  -- Wrench Set: shortage in WH-B, excess in WH-A
  (9, 1,  30, 10),
  (9, 2,  2,  10),

  -- A4 Paper: shortage in WH-A, excess in WH-B
  (10, 1, 50,  100),
  (10, 2, 300, 100);
