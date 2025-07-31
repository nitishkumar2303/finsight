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
import sentimentRoutes from "./routes/sentimentRoutes.js";
import stockInsightsRoutes from "./routes/stockInsights.routes.js";
import testRoutes from "./routes/testRoutes.js";

const app = express();
const PORT = process.env.PORT || 5050;

//Middlewares
// Simplified CORS configuration
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: false, // Must be false when origin is "*"
  })
);

// Handle preflight OPTIONS requests
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With"
  );
  res.sendStatus(200);
});

// Add debugging middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

//Routes
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/holdings", holdingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/sentiment", sentimentRoutes);
// app.use("/api/stock-insights", stockInsightsRoutes); // Temporarily commented out
app.use("/api/test", testRoutes);

// app.use("/api/stocks", stockRoutes); // placeholder

app.get("/", (req, res) => {
  res.send("FinSight backend is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on the port ${PORT}`);
});
