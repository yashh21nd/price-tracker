// backend/cron/priceUpdater.js
const cron = require("node-cron");
const axios = require("axios");
const db = require("../config/firebase");
const cheerio = require("cheerio");

// Example cron job: run every 6 hours
cron.schedule("0 */6 * * *", async () => {
  console.log("🔄 Running price updater...");

  try {
    const productsSnapshot = await db.collection("products").get();

    for (let doc of productsSnapshot.docs) {
      const product = doc.data();
      const url = product.url;

      // Example scraping logic
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      // Example selector - adjust based on website
      const priceText = $("#priceblock_ourprice").text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));

      if (price) {
        await db.collection("products").doc(doc.id).update({
          price,
          lastUpdated: new Date(),
        });
        console.log(`✅ Updated ${product.name}: $${price}`);
      }
    }
  } catch (err) {
    console.error("❌ Error in price updater:", err.message);
  }
});
