// routes/productRoutes.js
const express = require("express");
const { addProduct, getProducts } = require("../controllers/productController");

console.log("Controllers loaded:", { addProduct, getProducts });

const router = express.Router();

// Add a product
router.post("/add", addProduct);

// Get all products
router.get("/", getProducts);

module.exports = router;

