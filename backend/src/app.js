import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { sequelize } from "./config/db.js";
import { ensureSeedData } from "./utils/seed.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureSeedData();

    const port = process.env.PORT || 3000;

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Could not start server:", error.message || error);
  }
};

start();
