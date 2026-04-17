import express from "express";
import { getShortages } from "../controllers/report.controller.js";
import { transferStock } from "../controllers/transfer.controller.js";
import { getProducts } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/report/shortages", getShortages);
router.post("/transfer", transferStock);
router.get("/products", getProducts);

export default router;
