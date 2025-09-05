const { sendPriceDropEmail } = require("./emailService");
const db = require("../config/firebase");

async function updateProductPrices() {
  console.log("🔄 Running price update...");

  const snapshot = await db.collection("products").get();

  for (const doc of snapshot.docs) {
    const product = doc.data();
    const currentPrice = await fetchPrice(product.url);

    if (currentPrice) {
      await doc.ref.update({
        currentPrice,
        lastChecked: new Date().toISOString(),
      });
      console.log(`✅ Updated ${product.name} → ${currentPrice}`);

      // 🚨 Send email if price drops
      if (currentPrice <= product.targetPrice) {
        await sendPriceDropEmail(
          product.userEmail,   // ✅ Send to product owner
          product.name,
          currentPrice,
          product.targetPrice,
          product.url
        );
      }
    } else {
      console.log(`⚠️ Could not fetch price for ${product.name}`);
    }
  }
}

module.exports = { updateProductPrices };
