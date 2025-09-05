// cron/cronJobs.js
const cron = require("node-cron");
const { updateProductPrices } = require("../utils/priceUpdater");

// Run every 6 hours
cron.schedule("0 */6 * * *", async () => {
  console.log("🕒 Cron job started: Updating product prices...");
  await updateProductPrices();
});
