import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./jobs/updatePrice.js"; // Importing the cron job to update stock prices
dotenv.config();

import connectDB from "./config/db.js";
connectDB();

//importing routes
import portfolioRoutes from "./routes/portfolioRoutes.js";
import holdingRoutes from "./routes/holdingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import stockRoutes from "./routes/stock.routes.js";

const app = express();
const PORT = process.env.PORT || 5050;

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/holdings", holdingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stock" , stockRoutes);

// app.use("/api/stocks", stockRoutes); // placeholder

app.get("/", (req, res) => {
  res.send("FinSight backend is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on the port ${PORT}`);
});
