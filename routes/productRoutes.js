const express = require("express");
const { addProduct, getProducts } = require("../controllers/productController");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Only logged-in users can add or view products
router.post("/add", verifyToken, addProduct);
router.get("/", verifyToken, getProducts);

module.exports = router;
