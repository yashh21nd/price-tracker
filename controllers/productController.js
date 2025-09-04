// controllers/productController.js
const db = require("../config/firebase");

const addProduct = async (req, res) => {
  try {
    const { name, url, targetPrice } = req.body;

    if (!name || !url || !targetPrice) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const productRef = db.collection("products").doc();
    await productRef.set({
      id: productRef.id,
      name,
      url,
      targetPrice,
      createdAt: new Date().toISOString(),
    });

    res.json({ message: "✅ Product added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const snapshot = await db.collection("products").get();
    const products = snapshot.docs.map((doc) => doc.data());
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addProduct, getProducts };
