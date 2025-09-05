const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Import Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// ✅ Root route
app.get("/", (req, res) => {
  res.send("✅ Price Tracker Backend is running!");
});

// ✅ Import Price Updater
const { checkPrices } = require("./cron/priceUpdater");

// ✅ Auto-run price check every 15 minutes
setInterval(checkPrices, 15 * 60 * 1000);

// ✅ Manual trigger for price update
app.get("/api/check-prices", async (req, res) => {
  await checkPrices();
  res.json({ message: "✅ Price check complete" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
